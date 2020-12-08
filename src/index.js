/**
 * @file Setting up a GraphQL server using Express
 *
 */
import { log } from "dbc-node-logger";
import schema from "./schema/schema";
import creatorLoader from "./datasources/creator.datasource";
import workLoader from "./datasources/work.datasource";
import openformatLoader from "./datasources/openformat.datasource";
import recommendationsLoader from "./datasources/recommendations.datasource";
import idmapperLoader from "./datasources/idmapper.datasource";
import moreinfoLoader from "./datasources/moreinfo.datasource";
import simplesearchLoader from "./datasources/simplesearch.datasource";
import suggesterLoader from "./datasources/suggester.datasource";
import express from "express";
import cors from "cors";
import graphqlHTTP from "express-graphql";
import DataLoader from "dataloader";
import config from "./config";
import howruHandler from "./howru";
import { metrics, observeDuration, count } from "./utils/monitor";
import { selectionsToKey } from "./utils/graphqlparser";

const app = express();
let server;

(async () => {
  app.use(cors());

  // Middleware that monitors performance of GraphQL queries
  app.use(async (req, res, next) => {
    const start = process.hrtime();
    res.once("finish", () => {
      // If queryKey is present in req, the query was succesful
      // and we observe the duration
      if (req.queryKey) {
        const elapsed = process.hrtime(start);
        const seconds = elapsed[0] + elapsed[1] / 1e9;
        observeDuration(req.queryKey, seconds);
      }
    });
    next();
  });

  // set up context per request
  app.use((req, res, next) => {
    // user authentication could be done here

    req.datasources = {
      creator: new DataLoader(creatorLoader),
      openformat: new DataLoader(openformatLoader),
      recommendations: new DataLoader(recommendationsLoader, {
        // the key of recommendation batchloader is an object
        // hence we stringify
        cacheKeyFn: key => JSON.stringify(key)
      }),
      idmapper: new DataLoader(idmapperLoader),
      moreinfo: new DataLoader(moreinfoLoader),
      workservice: new DataLoader(workLoader),
      simplesearch: new DataLoader(simplesearchLoader, {
        // the key of simplesearch batchloader is an object
        // hence we stringify
        cacheKeyFn: key => JSON.stringify(key)
      }),
      suggester: new DataLoader(suggesterLoader, {
        // the key of suggester batchloader is an object
        // hence we stringify
        cacheKeyFn: key => JSON.stringify(key)
      })
    };

    next();
  });

  // Setup route handler for GraphQL
  app.use(
    "/graphql",
    graphqlHTTP({
      schema: await schema(),
      graphiql: true,
      extensions: ({ document, context, result }) => {
        // Create queryKey if query was succesful
        if (document && document.definitions && !result.errors) {
          context.queryKey = selectionsToKey(document.definitions);
          count("query_success");
        } else {
          count("query_error");
        }
      }
    })
  );

  // Setup route handler for howru
  app.get("/howru", howruHandler);

  // Setup route handler for metrics
  app.get("/metrics", metrics);

  server = app.listen(config.port);
  log.info(`Running GraphQL API at http://localhost:${config.port}/graphql`);
})();

const signals = {
  SIGINT: 2,
  SIGTERM: 15
};
function shutdown(signal, value) {
  server.close(function() {
    log.info(`server stopped by ${signal}`);
    process.exit(128 + value);
  });
}
Object.keys(signals).forEach(function(signal) {
  process.on(signal, function() {
    shutdown(signal, signals[signal]);
  });
});
