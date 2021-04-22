import DataLoader from "dataloader";
import { log } from "dbc-node-logger";
import { getFilesRecursive } from "./utils/utils";

// Find all datasources in src/datasources
const datasources = getFilesRecursive("./src/datasources")
  .map(
    (file) =>
      file.path.endsWith(".datasource.js") &&
      require(file.path).default && {
        batchLoader: require(file.path).default,
        name: file.file.replace(".datasource.js", ""),
      }
  )
  .filter((func) => !!func);

log.info(`found ${datasources.length} datasources`, {
  datasources: datasources.map((datasource) => datasource.name),
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
