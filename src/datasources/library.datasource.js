import request from "superagent";
import config from "../config";

const endpoint = "/libraries";
export async function load({ agencyid, accessToken }) {
  const url = config.datasources.openplatform.url + endpoint;
  return (
    await request.post(url).send({
      access_token: accessToken,
      agencyIds: [`${agencyid}`],
    })
  ).body.data;
}
