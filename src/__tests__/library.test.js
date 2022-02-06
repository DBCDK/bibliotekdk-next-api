/**
 * @file This file contains tests for the GraphQL API
 *
 * We want to ensure:
 *  - That fields can be retrieved as expected. If a type is changed, these tests should
 *    generally still work. Changes should be backwards compatible.
 *  - Error handling works.
 *  - Proper handling of insane/complex queries. For instance, highly nested queries
 *    that results in explosion of requests to underlying services.
 *
 * Error handling:
 *  - User errors. Query syntax errors, Queries that do not adhere to the schema, missing variables etc.
 *  - Datasource errors. Data from datasource with wrong format. Data not found.
 *    If we don't validate, these will probably lead to resolver errors.
 *  - Resolver errors. Bugs in resolvers, datasource errors may lead to resolver errors.
 *    We should have these logged, to be able to identify whether its a resolver bug or datasource bug
 *  - Network errors.
 *
 * It should be possible for users of the API to discern from the respone what type of error
 * they are getting. THIS IS STILL WORK IN PROGRESS
 *
 */

import { graphql } from "graphql";
import { getExecutableSchema } from "../schemaLoader";
import { createMockedDataLoaders } from "../datasourceLoader";

export async function performTestQuery({ query, variables, context }) {
  return graphql(
    await getExecutableSchema({
      loadExternal: false,
      clientPermissions: { admin: true },
    }),
    query,
    null,
    context,
    variables
  );
}

test("library - get branches for agency", async () => {
  const result = await performTestQuery({
    query: `
          query{
            branches(agencyid: "710100"){
              hitcount
              result {
                borrowerCheck
                agencyId
                branchId
                name
                openingHours
                userParameters {
                  userParameterType
                  parameterRequired
                }
                postalAddress
                postalCode
                city
                pickupAllowed
                digitalCopyAccess
              }
            }
          }
        `,
    variables: {},
    context: { datasources: createMockedDataLoaders() },
  });
  expect(result).toMatchSnapshot();
});

test("library - get all", async () => {
  const result = await performTestQuery({
    query: `
        query{
            branches{
              hitcount
              result {
                borrowerCheck
                agencyName
                agencyId
                branchId
                name
                openingHours
                userParameters {
                  userParameterType
                  parameterRequired
                }
                postalAddress
                postalCode
                city
                pickupAllowed
                digitalCopyAccess
              }
            }
          }
        `,
    variables: {},
    context: { datasources: createMockedDataLoaders() },
  });
  expect(result).toMatchSnapshot();
});
