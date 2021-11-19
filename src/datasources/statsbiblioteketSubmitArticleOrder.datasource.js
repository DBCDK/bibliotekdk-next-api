import { log } from "dbc-node-logger";
import request from "superagent";
import config from "../config";

const { url, user, password } = config.datasources.statsbiblioteket;

function createRequestString({
  pid,
  pickUpBranch,
  userId,
  userName,
  userMail,
  agencyId,
}) {
  return `<?xml version="1.0"?>
  <placeCopyRequest>
    <ws_user>${user}</ws_user>
    <ws_password>${password}</ws_password>
    <pid>${pid}</pid>
    <agencyId>${agencyId}</agencyId>
    <pickupAgencyId>${pickUpBranch}</pickupAgencyId>
    <userName>${userName}</userName>
    <userMail>${userMail}</userMail>
  </placeCopyRequest>`;
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
  const requestString = createRequestString({
    pid,
    pickUpBranch,
    userId: smaugUser.id,
    userName: user.name,
    userMail: user.mail,
    agencyId: user.agency,
  });
  const endpoint = `${url}/elba-webservices/services/placecopyrequest`;

  console.log(endpoint, requestString);

  // TODO - make this work- server responds with 400
  const res = await request
    .post(endpoint)
    .set("Content-Type", "application/xml")
    .send(requestString);

  return res;
}
