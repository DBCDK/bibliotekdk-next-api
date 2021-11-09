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
import { internalSchema } from "../schemaLoader";
import { createMockedDataLoaders } from "../datasourceLoader";

export async function performTestQuery({ query, variables, context }) {
  return graphql(internalSchema, query, null, context, variables);
}

test("localizations - get for a number of pids", async () => {
  const result = await performTestQuery({
    query: `
          query  {
            work(id: "work-of:870970-basis:47051649") {
              materialTypes {          
                localizations{
                  count
                  agencies{
                  agencyId
                    holdingItems{
                      localizationPid
                      localIdentifier
                      codes
                    }
                  }
                }
              }
            }
          }
        `,
    variables: {},
    context: { datasources: createMockedDataLoaders() },
  });
  expect(result).toMatchSnapshot();
});
