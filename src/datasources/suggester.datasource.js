/**
 * @file Get suggestions
 *
 * This is temporary until real suggester is implemented
 */

import request from "superagent";

export async function load({ q }) {
  const result = await request
    .get(
      "http://laesekompas-webservice-service.os-externals.svc.cloud.dbc.dk/api/suggest"
    )
    .query({ query: q });
  return result.body;
}

export function createStatusChecker(loadFunc) {
  /**
   * The status function
   *
   * @throws Will throw error if service is down
   */
  return async function status() {
    await loadFunc({ q: "hest" });
  };
}

export const options = {
  redis: {
    prefix: "suggester",
    ttl: 60 * 60 * 24,
  },
};
