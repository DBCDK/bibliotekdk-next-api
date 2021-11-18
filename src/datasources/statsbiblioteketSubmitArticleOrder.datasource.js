import { log } from "dbc-node-logger";
import request from "superagent";
import config from "../config";

const { url, user, password } = config.datasources.statsbiblioteket;

function createSoapRequest({
  pid,
  pickUpBranch,
  userId,
  userName,
  userMail,
  agencyId,
}) {
  return `<SOAP-ENV:Envelope xmlns="http://statsbiblioteket.dk/xws/elba-placecopyrequest-schema" xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/">
  <SOAP-ENV:Body>
    <placeCopyRequest>
      <ws_user>${user}</ws_user>
      <ws_password>${password}</ws_password>
      <pid>${pid}</pid>
      <user_loaner_id>${userId}</user_loaner_id>
      <userName>${userName}</userName>
      <userMail>${userMail}</userMail>
      <user_interest_date>${createNeedBeforeDate()}</user_interest_date>
      <pickupAgencyId>${pickUpBranch}</pickupAgencyId>
      <agencyId>${agencyId}</agencyId>
    </placeCopyRequest>
  </SOAP-ENV:Body>
</SOAP-ENV:Envelope>`;
}

/**
 * Creates date three months in the future. Used if a date is not provided
 */
function createNeedBeforeDate() {
  let offsetInDays = 90;
  let offsetInMilliseconds = offsetInDays * 24 * 60 * 60 * 1000;
  let date = new Date(Date.now() + offsetInMilliseconds);
  let dateStr = `${date.getFullYear()}-${("0" + (date.getMonth() + 1)).slice(
    -2
  )}-${("0" + date.getDate()).slice(-2)}`;
  return dateStr;
}

/**
 * Fetches a work from the work service
 * @param {Object} params
 * @param {string} params.workId id of the work
 */
export async function load({ pid, pickUpBranch, smaug, user }) {
  const smaugUser = smaug.user;
  const soap = createSoapRequest({
    pid,
    pickUpBranch,
    userId: smaugUser.id,
    userName: user.name,
    userMail: user.mail,
    agencyId: user.agency,
  });
  const endpoint = `${url}/elba-webservices/services/placecopyrequest`;

  // console.log(endpoint, soap);

  // TODO - make this work- server responds with 415 (wrong content type)
  const res = await request
    .post(endpoint)
    .set("Content-Type", "text/xml")
    .send(soap);

  return res;
}
