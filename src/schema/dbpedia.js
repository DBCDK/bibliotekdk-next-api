/**
 * @file DK5 type definition and resolvers
 *
 */

export const typeDef = `
type dbPedia {
  wikiId:String
}`;

export const resolvers = {
  dbPedia:{
    async wikiId(parent, args, context, info) {
      const res = await context.datasources.dbpedia.load("Q202693");
      return res[0].wikipedia_id.value
    }
  },
};
