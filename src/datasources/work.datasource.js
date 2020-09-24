import request from "superagent";
import config from "../config";
import { withRedis } from "./redis.datasource";

const { url, agencyId, profile, ttl, prefix } = config.datasources.work;

/**
 * Fetches a work from the work service
 * @param {Object} params
 * @param {string} params.workId id of the work
 */
async function fetchWork({ workId }) {
  return (
    await request.get(url).query({
      workId,
      // trackingId: 'bibdk-api', this should be dynamic, and be generated per graphql request
      agencyId,
      profile
    })
  ).body;
}

/**
 * A DataLoader batch function
 *
 * @param {Array.<string>} keys The keys to fetch
 */
async function batchLoader(keys) {
  return await Promise.all(
    keys.map(async key => await fetchWork({ workId: key }))
  );
}

/**
 * Enhance batch function with Redis caching
 */
export default withRedis(batchLoader, {
  prefix,
  ttl
});
