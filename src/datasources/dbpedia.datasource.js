import request from "superagent";
import config from "../config";

function construcQuery(wiki_data_id){
  let query = `PREFIX wd: <http://www.wikidata.org/entity/>
      SELECT ?wikipedia_id WHERE {
        ?dbpedia_id owl:sameAs ?wikidata_id .
        ?dbpedia_id dbo:wikiPageID ?wikipedia_id .
        VALUES (?wikidata_id) {(wd:${wiki_data_id} )}
  }`
  return query;
}

/**
 * Fetch smaug configuration
 */
export async function load( wiki_data_id ) {

  console.log(wiki_data_id, "DATAIDARG")

  const url = "https://dbpedia.org/sparql?query=";
  const query = construcQuery(wiki_data_id);
  console.log(query, "QUERY");


  console.log(`${url}${query}`, "TOTALQOOUERY");
  const response =  (
    await request.get(
      `${url}${query}&format=application%2Fsparql-results%2Bjson`
    )
  ).body.results.bindings;

  console.log(response, "RESPONSE");
  return response
}



export const options = {
  redis: {
    prefix: "dbpedia-3",
    ttl: 60 * 60,
    staleWhileRevalidate: 60 * 60 * 24 * 90, // 90 days
  },
};
