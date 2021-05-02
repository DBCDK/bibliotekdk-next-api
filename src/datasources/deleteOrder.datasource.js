import config from "../config";
import request from "superagent";

const endpoint = "/order";
/**
 * Do the request
 * @param input
 * @param accessToken
 * @return {Promise<*>}
 */
export async function load({ orderId, orderType, accessToken }) {
  const url = config.datasources.openplatform.url + endpoint;
  const res = (
    await request.post(url).send({
      access_token: accessToken,
      orderId: orderId,
      orderType: orderType,
      delete: true,
    })
  ).body;
  // @TODO some kind of check - maybe on res.error & res.statuscode

  return res.data;
}
