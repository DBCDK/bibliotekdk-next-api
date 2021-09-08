/**
 * @file Series type definition and resolvers
 *
 * Contains mocked data for now
 */

/**
 * The Series type definition
 */
export const typeDef = `
type Series {
  part: String
  title: String
  works: [Work!]!
}`;

/**
 * Resolvers for the Series type
 * Note that for fields not represented in resolvers, GraphQL
 * uses its default resolver (it looks in parent obj for the field).
 */
export const resolvers = {
  Series: {
    async part(parent, args, context, info) {
      // Return if the part numbers is given by the work-service
      if (parent.series && parent.series.instalment) {
        return parent.series.instalment;
      }

      // If not, return from series-service index
      const data = await context.datasources.series.load({
        workId: parent.workId,
      });

      if (data && data.series) {
        return data.series.indexOf(parent.workId) + 1;
      }

      return null;
    },
    title(parent, args, context, info) {
      // Return series title from work-service
      if (parent.series && parent.series.title) {
        return parent.series.title;
      }

      return null;
    },
    async works(parent, args, context, info) {
      const data = await context.datasources.series.load({
        workId: parent.workId,
      });

      if (data && data.series) {
        const works = await Promise.all(
          data.series.map(
            async (id) => (await context.datasources.workservice.load(id)).work
          )
        );

        return works.map((entry, index) => ({ ...entry, part: index + 1 }));
      }

      return [];
    },
  },
};
