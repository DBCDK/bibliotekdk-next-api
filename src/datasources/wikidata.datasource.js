import request from 'superagent';
import config from '../config';

function construcQuery(wiki_data_id) {
  let query = `SELECT  ?IMDb_ID ?MUSICBRAINZ_ID ?VIAF_ID ?FACEBOOK ?IMAGE ?HOMEPAGE WHERE {
OPTIONAL {wd:${wiki_data_id} wdt:P345 ?IMDb_ID}.
OPTIONAL {wd:${wiki_data_id} wdt:P434 ?MUSICBRAINZ_ID}. 
OPTIONAL {wd:${wiki_data_id} wdt:P214 ?VIAF_ID}.
OPTIONAL {wd:${wiki_data_id} wdt:P2013 ?FACEBOOK}.
OPTIONAL {wd:${wiki_data_id} wdt:P18 ?IMAGE}.
OPTIONAL {wd:${wiki_data_id} wdt:P856 ?HOMEPAGE}}`;
  return query;
}

/**
 * Fetch smaug configuration
 */
export async function load(wiki_data_id) {
  const url = 'https://query.wikidata.org/sparql?query=';
  const query = construcQuery(wiki_data_id);

  console.log(query, 'QUERY');

  try {
    const response = (
        /* await request.get(
           `${url}${query}&format=application%2Fsparql-results%2Bjson`
         )*/
        await request.get(
            `https://query.wikidata.org/sparql?query=${query}&format=json`
        ).set('User-Agent', 'node-superagent/1.3.0')
    ).body.results;
    console.log(response, 'RESPONSE');
    return response;
  } catch (e) {
    console.log(e, 'ERROR');
  }
}


export const options = {
  redis: {
    prefix: "wikidata-8",
    ttl: 60 * 60,
    staleWhileRevalidate: 60 * 60 * 24 * 90, // 90 days
  },
};

