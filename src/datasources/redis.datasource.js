import { log } from "dbc-node-logger";
import redis from "redis";

// Redis client
let client;

// Variable indicating if we are connected
let isConnected = false;

/**
 * Connect to a Redis server and create event handlers
 *
 * @param {Object} params The params object
 * @param {string} params.host The Redis host
 * @param {number|string} params.port The Redis port
 * @param {string} params.prefix The Redis prefix
 */
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
    prefix,
    retry_strategy: function(options) {
      // We retry forever
      // Wait at most 5000 ms between each retry
      return Math.min(options.attempt * 100, 5000);
    }
  });

  client.on("connect", function() {
    isConnected = true;
    log.info(`Connected to Redis`, {
      redisHost: host,
      redisPort: port,
      redisPrefix: prefix
    });
  });

  client.on("end", function() {
    isConnected = false;
    log.error(`Disconnected from Redis`, {
      redisHost: host,
      redisPort: port,
      redisPrefix: prefix
    });
  });

  client.on("error", function(error) {
    // Only log when connected to Redis,
    // otherwise we get spammed
    if (isConnected) {
      log.error(`Some Redis error occured: ${error.message}`, {
        redisHost: host,
        redisPort: port,
        redisPrefix: prefix
      });
    }
  });
}

/**
 * Wrap the Redis mget function in a Promise.
 * The promise will always resolve - never reject.
 * In case of failure, we log and move on,
 * keys will be fetched from data source.
 *
 * @param {string} keys The keys to fetch
 */
async function mget(keys) {
  return new Promise(resolve => {
    if (isConnected) {
      client.mget(keys, (error, result) => {
        if (error) {
          log.error(`Redis mget failed`, {
            keys
          });
          // Return array filled with null values,
          // to let the requests pass through
          resolve(keys.map(() => null));
        } else {
          resolve(result.map(val => JSON.parse(val)));
        }
      });
    } else {
      // Return array filled with null values,
      // to let the requests pass through
      resolve(keys.map(() => null));
    }
  });
}

/**
 * Wrap the Redis setex function in a Promise.
 * The promise will always resolve - never reject.
 * In case of failure, we log and move on.
 *
 * @param {string} key The key
 * @param {number} seconds Time to live in seconds
 * @param {Object} val The value to store
 */
async function setex(key, seconds, val) {
  return new Promise(resolve => {
    if (isConnected) {
      client.setex(key, seconds, JSON.stringify(val), (error, result) => {
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
        if (!(values[idx] instanceof Error)) {
          return setexFunc(`${prefix}_${key}`, ttl, values[idx]);
        }
      });
    }

    // Return array of values
    const res = keys.map((key, idx) => {
      if (cachedValues[idx]) {
        return cachedValues[idx];
      }
      return values.shift();
    });
    return res;
  }

  return redisBatchLoader;
}
