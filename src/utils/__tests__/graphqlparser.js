import { selectionsToKey } from "../graphqlparser";

describe("graphqlparser", () => {
  test("selectionsToKey", () => {
    // Operation definitions of a graphql document
    // https://spec.graphql.org/June2018/#sec-Language.Document
    //
    // Operation Definitions generated for the following query
    // query ($workId: String!) {
    //   work(id: $workId) {
    //     cover {
    //       detail
    //     }
    //     materialTypes {
    //       content
    //       recommendations {
    //         value
    //         manifestation {
    //           title
    //         }
    //       }
    //     }
    //   }
    //   work(id: $workId) {
    //     cover {
    //       detail
    //     }
    //   }
    // }
    const operationDefinitions = [
      {
        kind: "OperationDefinition",
        operation: "query",
        variableDefinitions: [
          {
            kind: "VariableDefinition",
            variable: {
              kind: "Variable",
              name: {
                kind: "Name",
                value: "workId",
                loc: { start: 8, end: 14 }
              },
              loc: { start: 7, end: 14 }
            },
            type: {
              kind: "NonNullType",
              type: {
                kind: "NamedType",
                name: {
                  kind: "Name",
                  value: "String",
                  loc: { start: 16, end: 22 }
                },
                loc: { start: 16, end: 22 }
              },
              loc: { start: 16, end: 23 }
            },
            directives: [],
            loc: { start: 7, end: 23 }
          }
        ],
        directives: [],
        selectionSet: {
          kind: "SelectionSet",
          selections: [
            {
              kind: "Field",
              name: {
                kind: "Name",
                value: "work",
                loc: { start: 29, end: 33 }
              },
              arguments: [
                {
                  kind: "Argument",
                  name: {
                    kind: "Name",
                    value: "id",
                    loc: { start: 34, end: 36 }
                  },
                  value: {
                    kind: "Variable",
                    name: {
                      kind: "Name",
                      value: "workId",
                      loc: { start: 39, end: 45 }
                    },
                    loc: { start: 38, end: 45 }
                  },
                  loc: { start: 34, end: 45 }
                }
              ],
              directives: [],
              selectionSet: {
                kind: "SelectionSet",
                selections: [
                  {
                    kind: "Field",
                    name: {
                      kind: "Name",
                      value: "cover",
                      loc: { start: 53, end: 58 }
                    },
                    arguments: [],
                    directives: [],
                    selectionSet: {
                      kind: "SelectionSet",
                      selections: [
                        {
                          kind: "Field",
                          name: {
                            kind: "Name",
                            value: "detail",
                            loc: { start: 67, end: 73 }
                          },
                          arguments: [],
                          directives: [],
                          loc: { start: 67, end: 73 }
                        }
                      ],
                      loc: { start: 59, end: 79 }
                    },
                    loc: { start: 53, end: 79 }
                  },
                  {
                    kind: "Field",
                    name: {
                      kind: "Name",
                      value: "materialTypes",
                      loc: { start: 84, end: 97 }
                    },
                    arguments: [],
                    directives: [],
                    selectionSet: {
                      kind: "SelectionSet",
                      selections: [
                        {
                          kind: "Field",
                          name: {
                            kind: "Name",
                            value: "content",
                            loc: { start: 106, end: 113 }
                          },
                          arguments: [],
                          directives: [],
                          loc: { start: 106, end: 113 }
                        },
                        {
                          kind: "Field",
                          name: {
                            kind: "Name",
                            value: "recommendations",
                            loc: { start: 120, end: 135 }
                          },
                          arguments: [],
                          directives: [],
                          selectionSet: {
                            kind: "SelectionSet",
                            selections: [
                              {
                                kind: "Field",
                                name: {
                                  kind: "Name",
                                  value: "value",
                                  loc: { start: 146, end: 151 }
                                },
                                arguments: [],
                                directives: [],
                                loc: { start: 146, end: 151 }
                              },
                              {
                                kind: "Field",
                                name: {
                                  kind: "Name",
                                  value: "manifestation",
                                  loc: { start: 160, end: 173 }
                                },
                                arguments: [],
                                directives: [],
                                selectionSet: {
                                  kind: "SelectionSet",
                                  selections: [
                                    {
                                      kind: "Field",
                                      name: {
                                        kind: "Name",
                                        value: "title",
                                        loc: { start: 186, end: 191 }
                                      },
                                      arguments: [],
                                      directives: [],
                                      loc: { start: 186, end: 191 }
                                    }
                                  ],
                                  loc: { start: 174, end: 201 }
                                },
                                loc: { start: 160, end: 201 }
                              }
                            ],
                            loc: { start: 136, end: 209 }
                          },
                          loc: { start: 120, end: 209 }
                        }
                      ],
                      loc: { start: 98, end: 215 }
                    },
                    loc: { start: 84, end: 215 }
                  }
                ],
                loc: { start: 47, end: 219 }
              },
              loc: { start: 29, end: 219 }
            },
            {
              kind: "Field",
              name: {
                kind: "Name",
                value: "work",
                loc: { start: 222, end: 226 }
              },
              arguments: [
                {
                  kind: "Argument",
                  name: {
                    kind: "Name",
                    value: "id",
                    loc: { start: 227, end: 229 }
                  },
                  value: {
                    kind: "Variable",
                    name: {
                      kind: "Name",
                      value: "workId",
                      loc: { start: 232, end: 238 }
                    },
                    loc: { start: 231, end: 238 }
                  },
                  loc: { start: 227, end: 238 }
                }
              ],
              directives: [],
              selectionSet: {
                kind: "SelectionSet",
                selections: [
                  {
                    kind: "Field",
                    name: {
                      kind: "Name",
                      value: "cover",
                      loc: { start: 246, end: 251 }
                    },
                    arguments: [],
                    directives: [],
                    selectionSet: {
                      kind: "SelectionSet",
                      selections: [
                        {
                          kind: "Field",
                          name: {
                            kind: "Name",
                            value: "detail",
                            loc: { start: 260, end: 266 }
                          },
                          arguments: [],
                          directives: [],
                          loc: { start: 260, end: 266 }
                        }
                      ],
                      loc: { start: 252, end: 272 }
                    },
                    loc: { start: 246, end: 272 }
                  }
                ],
                loc: { start: 240, end: 276 }
              },
              loc: { start: 222, end: 276 }
            }
          ],
          loc: { start: 25, end: 278 }
        },
        loc: { start: 0, end: 278 }
      }
    ];
    const actual = selectionsToKey(operationDefinitions);
    const expected =
      "QUERY_work:cover_work:materialTypes:recommendations:manifestation";
    expect(actual).toEqual(expected);
  });
});
