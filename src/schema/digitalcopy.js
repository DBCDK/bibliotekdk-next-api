/**
 * @file Digital Copy type definition and resolvers
 *
 */

export const typeDef = `
 input DigitalCopyOrderArticle {
   pid: String! 
   pickUpBranch: String!
 }
 enum DigitalCopyResponseStatus {
   OK
   ERROR_UNAUTHORIZED_USER
   ERROR_AGENCY_NOT_SUBSCRIBED
   ERROR_INVALID_PICKUP_BRANCH
   ERROR_PID_NOT_RESERVABLE
 }
 type DigitalCopyResponse {
   status: DigitalCopyResponseStatus!
 }
 `;

export const resolvers = {};
