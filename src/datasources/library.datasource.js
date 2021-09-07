import request from "superagent";
import config from "../config";
import { createIndexer } from "../utils/searcher";

const endpoint = "/libraries";

const fields = [
  "name",
  "agencyName",
  "agencyId",
  "branchId",
  "city",
  "postalCode",
];

// Indexer options
const options = {
  fields, // fields to index for full-text search
  storeFields: fields,
};

// Default search options
const searchOptions = {
  boost: { name: 10000, agencyName: 7500, city: 250 },
  combineWith: "AND",
  prefix: true,
};

// We cache the docs for 30 minutes
let branches;
let branchesMap;
let lastUpdateMS;
let fetchingPromise;
const index = createIndexer({ options });
const timeToLiveMS = 1000 * 60 * 30;

async function get({ accessToken }) {
  const url = config.datasources.openplatform.url + endpoint;

  let args = { access_token: accessToken };

  const result = (await request.post(url).send(args)).body.data;

  return result;
}

export async function search(props, getFunc) {
  const { q, limit = 10, offset = 0, agencyid, language = "da" } = props;

  const age = lastUpdateMS ? new Date().getTime() - lastUpdateMS : 0;

  if (!branches || age > timeToLiveMS) {
    try {
      // Handle race condition
      // Avoid fetching branches at mulitple requests at a time
      if (fetchingPromise) {
        await fetchingPromise;
      } else {
        fetchingPromise = getFunc(props);
        branches = (await fetchingPromise).map((branch) => ({
          ...branch,
          id: branch.branchId,
          name: branch.branchName.join(" "),
        }));

        branchesMap = {};
        branches.forEach((branch) => (branchesMap[branch.id] = branch));

        lastUpdateMS = new Date().getTime();
      }
    } finally {
      // Clean up promise
      fetchingPromise = null;
    }
  }

  let result = branches;

  if (q) {
    // prefix match
    result = index.search(q, branches, searchOptions);

    // If no match use fuzzy to find nearest match
    if (result.length === 0) {
      // try fuzzy  match
      result = index.search(q, branches, {
        ...searchOptions,
        fuzzy: 0.4,
      });
    }
  }

  // merged to return all fields.
  let merged = result.map((branch) => ({
    ...branch,
    ...branchesMap[branch.id],
  }));

  if (agencyid) {
    const stripped = agencyid.replace(/\D/g, "");
    merged = merged.filter((branch) => branch.agencyId === stripped);
  }

  return {
    hitcount: merged.length,
    result: merged
      .slice(offset, limit)
      .map((branch) => ({ ...branch, language })),
  };
}

export async function load(props) {
  return search(props, get);
}
