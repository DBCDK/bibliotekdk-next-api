import request from "superagent";

import config from "../config";
import { log } from "dbc-node-logger";
require("superagent-proxy")(request);

export async function load() {
  const proxy = config.dmzproxy.url;

  console.log(proxy, "PROXY");

  try {
    let res = proxy
      ? (
          await request
            .get(
              `${config.datasources.statsbiblioteket.url}/copydanws/journals`
            )
            .proxy(proxy)
            .set("Accept", "application/json")
        ).body
      : (
          await request
            .get(
              `${config.datasources.statsbiblioteket.url}/copydanws/journals`
            )
            .set("Accept", "application/json")
        ).body;

    const journalsMap = res.journals.journal.reduce((map, journal) => {
      map[journal.issn] = 1;
      console.log(map);
      return map;
    }, {});

    return journalsMap;
  } catch (e) {
    console.log("FISK");
    console.log(e.message);
    log.error(
      "Request statsbiblioteket failed : " +
        config.datasources.statsbiblioteket.url +
        " message: " +
        e.message
    );
  }
}

export const options = {
  redis: {
    prefix: "statsbiblioteketJournals7",
    ttl: 60 * 60,
    staleWhileRevalidate: 60 * 60 * 24 * 30, // 30 days
    inMemory: true,
  },
};
