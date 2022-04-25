export const typeDef = `
union Draft_Subject = Draft_SubjectText | Draft_Corporation | Draft_Person | Draft_TimePeriod

type Draft_SubjectText {
  type: Draft_SubjectType!
  display: String!
}
type Draft_TimePeriod {
  period: Draft_Range! 
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
`;

export const resolvers = {};
