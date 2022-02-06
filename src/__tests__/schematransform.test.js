import { graphql } from "graphql";
import { getExecutableSchema } from "../schemaLoader";
import { createMockedDataLoaders } from "../datasourceLoader";
import { printSchema, buildClientSchema } from "graphql";

const introspectionQuery = `
query IntrospectionQuery {
  __schema {
    
    queryType { name }
    mutationType { name }
    subscriptionType { name }
    types {
      ...FullType
    }
    directives {
      name
      description
      
      locations
      args {
        ...InputValue
      }
    }
  }
}

fragment FullType on __Type {
  kind
  name
  description
  fields(includeDeprecated: true) {
    name
    description
    args {
      ...InputValue
    }
    type {
      ...TypeRef
    }
    isDeprecated
    deprecationReason
  }
  inputFields {
    ...InputValue
  }
  interfaces {
    ...TypeRef
  }
  enumValues(includeDeprecated: true) {
    name
    description
    isDeprecated
    deprecationReason
  }
  possibleTypes {
    ...TypeRef
  }
}

fragment InputValue on __InputValue {
  name
  description
  type { ...TypeRef }
  defaultValue
}

fragment TypeRef on __Type {
  kind
  name
  ofType {
    kind
    name
    ofType {
      kind
      name
      ofType {
        kind
        name
        ofType {
          kind
          name
          ofType {
            kind
            name
            ofType {
              kind
              name
              ofType {
                kind
                name
              }
            }
          }
        }
      }
    }
  }
}
`;

export async function performTestQuery({
  query,
  variables,
  context,
  clientPermissions,
}) {
  return graphql(
    await getExecutableSchema({
      loadExternal: false,
      clientPermissions,
    }),
    query,
    null,
    context,
    variables
  );
}

test("limited access to root fields", async () => {
  const result = await performTestQuery({
    query: introspectionQuery,
    variables: {},
    context: {
      datasources: createMockedDataLoaders(),
      accessToken: "DUMMY_TOKEN",
    },
    clientPermissions: { allowRootFields: ["help"] },
  });

  expect(printSchema(buildClientSchema(result.data))).toMatchSnapshot();
});

test("remove all fields by type", async () => {
  const result = await performTestQuery({
    query: introspectionQuery,
    variables: {},
    context: {
      datasources: createMockedDataLoaders(),
      accessToken: "DUMMY_TOKEN",
    },
    clientPermissions: {
      allowRootFields: ["manifestation"],
      denyTypes: ["Cover"],
    },
  });

  expect(printSchema(buildClientSchema(result.data))).toMatchSnapshot();
});

test("default schema transform", async () => {
  const result = await performTestQuery({
    query: introspectionQuery,
    variables: {},
    context: {
      datasources: createMockedDataLoaders(),
      accessToken: "DUMMY_TOKEN",
    },
  });

  expect(printSchema(buildClientSchema(result.data))).toMatchSnapshot();
});
