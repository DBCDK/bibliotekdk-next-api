import DataLoader from "dataloader";
import { log } from "dbc-node-logger";
import { withRedis } from "./datasources/redis.datasource";
import monitor from "./utils/monitor";
import { getFilesRecursive } from "./utils/utils";

// Find all datasources in src/datasources
export const datasources = getFilesRecursive("./src/datasources")
  .map((file) => {
    if (!file.path.endsWith(".datasource.js")) {
      return;
    }
    const { load, options, batchLoader, status } = require(file.path);
    if (!load) {
      return;
    }

    // Extract datasource name from filename
    const name = file.file.replace(".datasource.js", "");

    // Monitor the load function from the datasource
    let monitoredLoad = monitor(
      {
        name: `REQUEST_${name}`,
        help: `${name} requests`,
      },
      load
    );

    // Log all request and responses
    // useful for capturing mock data for tests
    // Comment in to enable
    // monitoredLoad = async (key) => {
    //   const res = await load(key);
    //   console.log(
    //     "***MOCK****",
    //     name,
    //     JSON.stringify({ request: key, response: res })
    //   );
    //   return res;
    // };

    // if datasource exports a createBatchLoader we use that,
    // otherwise we use default batch loader
    let monitoredBatchLoader = batchLoader
      ? (keys) => batchLoader(keys, monitoredLoad)
      : async (keys) => {
          return await Promise.all(keys.map((key) => monitoredLoad(key)));
        };

    // Check if Redis is configured for this datasource
    if (options && options.redis && options.redis.prefix && options.redis.ttl) {
      monitoredBatchLoader = withRedis(monitoredBatchLoader, {
        prefix: options.redis.prefix,
        ttl: options.redis.ttl,
        staleWhileRevalidate: options.redis.staleWhileRevalidate,
      });
    }

    const statusChecker = status && (async () => await status(monitoredLoad));

    return {
      batchLoader: monitoredBatchLoader,
      name,
      options,
      statusChecker,
    };
  })
  .filter((func) => !!func);

log.info(`found ${datasources.length} datasources`, {
  datasources: datasources.map((datasource) => ({
    name: datasource.name,
    options: datasource.options,
  })),
});

/**
 * Will instantiate dataloaders from datasources
 */
export default function createDataLoaders() {
  const result = {};
  datasources.forEach((datasource) => {
    result[datasource.name] = new DataLoader(datasource.batchLoader, {
      // If key is an object, we stringify
      // to make it useful as a cache key
      cacheKeyFn: (key) =>
        typeof key === "object" ? JSON.stringify(key) : key,
    });
  });
  return result;
}

export function createMockedDataLoaders() {
  const mockedDatasources = {};
  getFilesRecursive("./src/datasources/mocked")
    .filter(
      (file) =>
        file.path.endsWith("datasource.mocked.js") && require(file.path).load
    )
    .map((file) => ({
      ...file,
      name: file.file.replace(".datasource.mocked.js", ""),
      load: require(file.path).load,
    }))
    .forEach((loader) => {
      mockedDatasources[loader.name] = loader;
    });
  return mockedDatasources;
}
