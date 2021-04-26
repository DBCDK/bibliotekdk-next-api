/**
 * @file Setting up a GraphQL server using Express
 *
 */
import { log } from "dbc-node-logger";
import schema from "./schemaLoader";
import creatorLoader from "./datasources/creator.datasource";
import helpTextsLoader from "./datasources/helptext.datasource";
import workLoader from "./datasources/work.datasource";
import openformatLoader from "./datasources/openformat.datasource";
import recommendationsLoader from "./datasources/recommendations.datasource";
import idmapperLoader from "./datasources/idmapper.datasource";
import moreinfoLoader from "./datasources/moreinfo.datasource";
import simplesearchLoader from "./datasources/simplesearch.datasource";
import suggesterLoader from "./datasources/suggester.datasource";
import availabilityLoader from "./datasources/availabaility.datasource";
import express from "express";
import cors from "cors";
import { graphqlHTTP } from "express-graphql";
import DataLoader from "dataloader";
import config from "./config";
import howruHandler from "./howru";
import { metrics, observeDuration, count } from "./utils/monitor";
import validateComplexity from "./utils/complexity";

import libraryLoader from "./datasources/libraries.datasource";

const app = express();
let server;

const promExporterApp = express();
// Setup route handler for metrics
promExporterApp.get("/metrics", metrics);
promExporterApp.listen(9599, () => {
  log.info(`Running metrics endpoint at http://localhost:9599/metrics`);
});

(async () => {
  app.use(cors());

  // Middleware that monitors performance of those GraphQL queries
  // which specify a monitor name.
  app.use(async (req, res, next) => {
    const start = process.hrtime();
    res.once("finish", () => {
      // monitorName is added to context/req in the monitor resolver
      if (req.monitorName) {
        const elapsed = process.hrtime(start);
        const seconds = elapsed[0] + elapsed[1] / 1e9;
        observeDuration(req.monitorName, seconds);
      }
    });
    next();
  });

  // set up context per request
  app.use((req, res, next) => {
    // Get bearer token from authorization header
    req.accessToken =
      req.headers.authorization &&
      req.headers.authorization.replace(/bearer /i, "");

    req.datasources = {
      creator: new DataLoader(creatorLoader),
      helptexts: new DataLoader(helpTextsLoader),
      openformat: new DataLoader(openformatLoader),
      recommendations: new DataLoader(recommendationsLoader, {
        // the key of recommendation batchloader is an object
        // hence we stringify
        cacheKeyFn: (key) => JSON.stringify(key),
      }),

      idmapper: new DataLoader(idmapperLoader),
      moreinfo: new DataLoader(moreinfoLoader),
      workservice: new DataLoader(workLoader),
      simplesearch: new DataLoader(simplesearchLoader, {
        // the key of simplesearch batchloader is an object
        // hence we stringify
        cacheKeyFn: (key) => JSON.stringify(key),
      }),
      suggester: new DataLoader(suggesterLoader, {
        // the key of suggester batchloader is an object
        // hence we stringify
        cacheKeyFn: (key) => JSON.stringify(key),
      }),
      availability: new DataLoader(availabilityLoader, {
        // the key of availability batchloader is an object
        // hence we stringify
        cacheKeyFn: (key) => JSON.stringify(key),
      }),
      library: new DataLoader(libraryLoader)
    };
    next();
  });

  let resolvedSchema;
  (async () => {
    resolvedSchema = await schema();
  })();
  // Setup route handler for GraphQL
  app.use(
    "/graphql",
    graphqlHTTP(async (request, response, graphQLParams) => ({
      schema: resolvedSchema,
      graphiql: { headerEditorEnabled: true },
      extensions: ({ document, context, result }) => {
        if (document && document.definitions && !result.errors) {
          count("query_success");
        } else {
          count("query_error");
          result.errors.forEach((error) => {
            log.error(error.message, error);
          });
        }
      },
      validationRules: [
        validateComplexity({
          query: graphQLParams.query,
          variables: graphQLParams.variables,
        }),
      ],
    }))
  );

  // Setup route handler for howru
  app.get("/howru", howruHandler);

  server = app.listen(config.port, () => {
    log.info(`Running GraphQL API at http://localhost:${config.port}/graphql`);
  });
})();

const signals = {
  SIGINT: 2,
  SIGTERM: 15,
};
function shutdown(signal, value) {
  server.close(function () {
    log.info(`server stopped by ${signal}`);
    process.exit(128 + value);
  });
}
Object.keys(signals).forEach(function (signal) {
  process.on(signal, function () {
    shutdown(signal, signals[signal]);
  });
});
