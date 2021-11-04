import request from "superagent";
import config from "../config";

const { url, ttl, prefix } = config.datasources.holdingstatus;

/**
 * Constructs soap request to perform placeOrder request
 * @param {array} parameters
 * @returns {string} soap request string
 */
function constructSoap(pid) {
  let soap = `<?xml version="1.0" encoding="UTF-8"?>
  <SOAP-ENV:Envelope xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ns1="http://oss.dbc.dk/ns/openholdingstatus"><SOAP-ENV:Body>
    <ns1:localisationsRequest>
        <ns1:agencyId>DK-870970</ns1:agencyId>
        <ns1:pid>${pid}</ns1:pid>
        <ns1:mergePids>true</ns1:mergePids>
        <ns1:outputType>json</ns1:outputType>
    </ns1:localisationsRequest>
  </SOAP-ENV:Body></SOAP-ENV:Envelope>`;
  return soap;
}

function parseResponse(text) {
  const obj = JSON.parse(text);

  const count = obj.localisationsResponse.localisations[0].agency.length;
  const holdingItems = obj.localisationsResponse.localisations[0].agency.map(
    (item) => {
      const holdingsItem = {};
      for (const [key, value] of Object.entries(item)) {
        holdingsItem[key] = value.$;
      }
      return holdingsItem;
    }
  );
  const ret = { count: count, holdingItems: holdingItems };
  console.log(ret, "RET");
  return ret;
}

export async function load({ pid }) {
  const soap = constructSoap(pid);

  const res = await request
    .post(url)
    .set("Content-Type", "text/xml")
    .send(soap);

  return parseResponse(res.text);
}

/* - no caching for now
export const options = {
  redis: {
    prefix,
    ttl,
    staleWhileRevalidate: 60 * 60 * 24 * 7, // 7 days
  },
};
*/
