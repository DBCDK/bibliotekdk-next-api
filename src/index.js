/**
 * @file Setting up a GraphQL server using Express
 *
 */
import { log } from "dbc-node-logger";
import { getExecutableSchema } from "./schemaLoader";
import express from "express";

import { createProxyMiddleware } from "http-proxy-middleware";

import cors from "cors";
import { graphqlHTTP, getGraphQLParams } from "express-graphql";
import { parse, getOperationAST, print } from "graphql";
import config from "./config";
import howruHandler from "./howru";
import { metrics, observeDuration, count } from "./utils/monitor";
import validateComplexity from "./utils/complexity";
import createDataLoaders from "./datasourceLoader";
import { uuid } from "uuidv4";
import isbot from "isbot";

import { PerformanceObserver } from "perf_hooks";

// Log dns and tcp connect durations
const obs = new PerformanceObserver((list) => {
  list.getEntries().forEach((entry) => {
    if (entry.duration > 500) {
      if (entry.name === "lookup") {
        log.info("DNS_DIAGNOSTICS", {
          diagnostics: {
            hostname: entry.detail.hostname,
            total: entry.duration,
          },
        });
      } else if (entry.name === "connect") {
        log.info("CONNECT_DIAGNOSTICS", {
          diagnostics: {
            host: entry.detail.host,
            total: entry.duration,
          },
        });
      }
    }
  });
});
obs.observe({ entryTypes: ["dns", "net"], buffered: true });

const app = express();
let server;

const proxy = createProxyMiddleware("http://localhost:3001", {
  changeOrigin: true,
  ws: true,
  logLevel: "silent",
});

const promExporterApp = express();
// Setup route handler for metrics
promExporterApp.get("/metrics", metrics);
promExporterApp.listen(9599, () => {
  log.info(`Running metrics endpoint at http://localhost:9599/metrics`);
});

(async () => {
  app.use(cors());
  // Set limit on body size
  app.use(express.json({ limit: 10000 }));

  // trust ip-addresses from X-Forwarded-By header, and log requests
  app.enable("trust proxy");

  // Middleware for replacing certain characters in response body.
  // This is a quick fix, and may be removed again if it is solved elsewhere.
  app.use(function (req, res, next) {
    var originalSend = res.send;
    res.send = function () {
      if (arguments[0] && arguments[0].replace) {
        arguments[0] = arguments[0].replace(/ꜳ/g, "aa").replace(/Ꜳ/g, "Aa");
      }
      originalSend.apply(res, arguments);
    };
    next();
  });

  // Middleware that monitors performance of those GraphQL queries
  // which specify a monitor name.
  app.post("/:agency/:profile/graphql", async (req, res, next) => {
    const start = process.hrtime();
    res.once("finish", () => {
      const elapsed = process.hrtime(start);
      const seconds = elapsed[0] + elapsed[1] / 1e9;

      // Convert variables to strings, to make sure there are no type conflicts,
      // when log is indexed
      let queryVariables = {};
      if (req.queryVariables) {
        Object.entries(req.queryVariables).forEach(
          ([key, val]) =>
            (queryVariables[key] =
              typeof val === "string" ? val : JSON.stringify(val))
        );
      }
      const userAgent = req.get("User-Agent");

      // detailed logging for SLA
      log.info("TRACK", {
        clientId: req?.smaug?.app?.clientId,
        uuid: req?.datasources?.trackingObject.uuid,
        parsedQuery: req.parsedQuery,
        queryVariables,
        datasources: { ...req?.datasources?.trackingObject?.trackObject },
        profile: req.profile,
        total_ms: Math.round(seconds * 1000),
        graphQLErrors: req.graphQLErrors && JSON.stringify(req.graphQLErrors),
        userAgent,
        userAgentIsBot: isbot(userAgent),
        ip: req?.smaug?.app?.ips?.[0],
      });
      // monitorName is added to context/req in the monitor resolver
      if (req.monitorName) {
        observeDuration(req.monitorName, seconds);
      }
    });
    next();
  });

  /**
   * Middleware for initializing dataloaders
   */
  app.post("/:agency/:profile/graphql", async (req, res, next) => {
    req.datasources = createDataLoaders(uuid());
    next();
  });

  /**
   * Middleware for validating access token, and fetching smaug configuration
   */
  app.post("/:agency/:profile/graphql", async (req, res, next) => {
    // Get graphQL params
    try {
      const graphQLParams = await getGraphQLParams(req);
      const document = parse(graphQLParams.query);
      const ast = getOperationAST(document);
      req.queryVariables = graphQLParams.variables;
      req.parsedQuery = graphQLParams.query
        .replace(/\n/g, " ")
        .replace(/\s+/g, " ");

      // Check if query is introspection query
      req.isIntrospectionQuery = isIntrospectionQuery(ast);
    } catch (e) {}

    // Get bearer token from authorization header
    req.accessToken =
      req.headers.authorization &&
      req.headers.authorization.replace(/bearer /i, "");

    // Fetch Smaug client configuration
    try {
      req.smaug =
        req.accessToken &&
        (await req.datasources.smaug.load({
          accessToken: req.accessToken,
        }));
      req.smaug.app.ips = (req.ips.length && req.ips) || [req.ip];

      // Agency of the smaug client
      const agency = req.smaug?.agencyId;

      req.profile = {
        agency,
        name: req.params.profile,
        combined: `${agency}/${req.params.profile}`,
      };
    } catch (e) {
      if (e.response && e.response.statusCode !== 404) {
        log.error("Error fetching from smaug", { response: e });
        res.status(500);
        return res.send({
          statusCode: 500,
          message: "Internal server error",
        });
      }
    }

    // If query is introspection, we allow access even though
    // No token is given
    if (!req.isIntrospectionQuery) {
      // Invalid access token
      if (!req.smaug) {
        res.status(403);
        return res.send({
          statusCode: 403,
          message: "Unauthorized",
        });
      }

      // Access token is valid, but client is not configured properly
      if (!req.profile?.agency) {
        log.error(
          `Missing agency in configuration for client ${req.smaug?.app?.clientId}`
        );
        res.status(403);
        return res.send({
          statusCode: 403,
          message:
            "Invalid client configuration. Missing agency in configuration for client.",
        });
      }
    }

    next();
  });

  /**
   * Check if operation is introspection
   * @param {*} operation
   * @returns
   */
  function isIntrospectionQuery(operation) {
    return operation.selectionSet.selections.every((selection) => {
      const fieldName = selection.name.value;
      return fieldName.startsWith("__");
    });
  }

  // Setup route handler for GraphQL
  app.post(
    "/:agency/:profile/graphql",
    graphqlHTTP(async (request, response, graphQLParams) => {
      return {
        schema: await getExecutableSchema({
          clientPermissions: request?.smaug?.gateway,
          hasAccessToken: !!request.accessToken,
        }),
        // graphiql: { headerEditorEnabled: true, shouldPersistHeaders: true },
        extensions: ({ document, context, result }) => {
          if (document && document.definitions && !result.errors) {
            count("query_success");
          } else {
            count("query_error");
            request.graphQLErrors = result.errors;
          }
        },
        validationRules: [
          validateComplexity({
            query: graphQLParams.query,
            variables: graphQLParams.variables,
          }),
        ],
      };
    })
  );

  // route handler for livelinessprobe
  // app.get("/", function (req, res) {
  //   res.send("hello world");
  // });
  // Setup route handler for howru - triggers an alert in prod
  app.get("/howru", howruHandler);

  app.use(proxy);

  // Default error handler
  app.use((error, request, response, next) => {
    if (error) {
      log.error(String(error), {
        error: String(error),
        stacktrace: error.stack,
      });
      response.status(500).send({ error: "Internal server error" });
    } else {
      next();
    }
  });

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
