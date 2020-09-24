import { log } from "dbc-node-logger";
import redis from "redis";

let client;
let isUp = false;

export function connectRedis({ host, port, prefix }) {
  log.info(`Connecting to Redis`, {
    redisHost: host,
    redisPort: port,
    redisPrefix: prefix
  });
  client = redis.createClient({
    host,
    port,
    enable_offline_queue: false,
    prefix
  });

  client.on("connect", function() {
    isUp = true;
    log.info(`Connected to Redis`, {
      redisHost: host,
      redisPort: port,
      redisPrefix: prefix
    });
  });

  client.on("end", function() {
    isUp = false;
    log.error(`Disconnected from Redis`, {
      redisHost: host,
      redisPort: port,
      redisPrefix: prefix
    });
  });

  client.on("error", function(error) {
    if (isUp) {
      console.error(error);
    }
  });
}

async function mget(keys) {
  return new Promise(resolve => {
    if (isUp) {
      client.mget(keys, (error, result) => {
        if (error) {
          log.error(`Redis mget failed`, {
            keys
          });
          // Return array filled with null values,
          // to let the requests pass through
          resolve(keys.map(() => null));
        } else {
          resolve(result);
        }
      });
    } else {
      resolve(keys.map(() => null));
    }
  });
}

async function setex(key, seconds, val) {
  return new Promise(resolve => {
    if (isUp) {
      client.setex(key, seconds, val, (error, result) => {
        if (error) {
          log.error(`Redis setex failed`, {
            key,
            val,
            seconds
          });
          resolve();
        } else {
          resolve(result);
        }
      });
    } else {
      resolve();
    }
  });
}

/**
 * A higher order function, that makes it easy to enhance
 * a batch loader with Redis caching capabilities.
 *
 * @param {function} batchFunc a DataLoader batch function
 * @param {Object} options The options object
 * @param {string} options.prefix Prefix to put on each keys
 * @param {number} options.ttl Time to live in seconds
 * @param {function} options.setex Inject setex function (for testing)
 * @param {function} options.mget Inject mget function (for testing)
 *
 * @returns {function} A Redis enhanced batch function
 */
export function withRedis(
  batchFunc,
  { prefix = "", ttl = 60, setexFunc = setex, mgetFunc = mget }
) {
  /**
   * This is a DataLoader batch function
   * It fetches as many keys from Redis as possible.
   * The rest will be fetched via the batchFunc that
   * is given to the outer function.
   * Finally, missing values are sent to Redis
   *
   * @param {Array.<string>} keys The keys to fetch
   */
  async function redisBatchLoader(keys) {
    // Create array of prefixed keys
    const prefixedKeys = keys.map(key => `${prefix}_${key}`);

    // Get values of all prefixed keys from Redis
    const cachedValues = await mgetFunc(prefixedKeys);

    // If some values were not found in Redis,
    // they are added to missing keys array
    const missingKeys = [];
    cachedValues.forEach((val, idx) => {
      if (!val) {
        missingKeys.push(keys[idx]);
      }
    });

    // Fetch missing values using the provided batch function
    let values;
    if (missingKeys.length > 0) {
      values = await batchFunc(missingKeys);

      // Store those missing values in Redis with expiration time set to ttl
      // We do not await here
      missingKeys.forEach((key, idx) => {
        return setexFunc(`${prefix}_${key}`, ttl, JSON.stringify(values[idx]));
      });
    }

    // Return array of values
    return keys.map((key, idx) => {
      if (cachedValues[idx]) {
        return JSON.parse(cachedValues[idx]);
      }
      return values.shift();
    });
  }

  return redisBatchLoader;
}
