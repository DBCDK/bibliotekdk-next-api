export const typeDef = `
interface Draft_Subject {
  display: String!
}
type Draft_SubjectText implements Draft_Subject {
  type: Draft_SubjectType!
  display: String!
}
type Draft_TimePeriod implements Draft_Subject {
  period: Draft_Range! 
  display: String!
}
enum Draft_SubjectType {
  """
  More to come
  """
  DBC_FICTION
}
type Draft_Range {
  begin: Int
  end: Int
  display: String!
}

type Draft_SubjectContainer {
  """
  All subjects
  """
  all: [Draft_Subject!]!

  """
  Only DBC verified subjects
  """
  dbcVerified: [Draft_Subject!]!
}
`;

export const resolvers = {};
