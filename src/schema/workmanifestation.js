/**
 * @file WorkManifestation type definition and resolvers
 *
 */

import { getArray, matchYear } from "../utils/utils";

/**
 * The WorkManifestation type definition
 */
export const typeDef = `
    type WorkManifestation {
      cover: Cover! 
      creators: [Creator!]!
      datePublished: String!
      description: String!
      fullTitle: String!
      language: [String!]!
      materialType: String!
      physicalDescription: String!
      pid: String!
      title: String
      recommendations(limit: Int): [Recommendation!]!
    }
  `;

/**
 * Resolvers for the WorkManifestation type
 * Note that for fields not represented in resolvers, GraphQL
 * uses its default resolver (it looks in parent obj for the field).
 *
 * Generally, we first look in the parent object for data, and
 * if not present we call moreinfo or openformat
 */
export const resolvers = {
  WorkManifestation: {
    cover(parent, args, context, info) {
      // Fetch cover, and pass it to Cover resolver
      return context.datasources.moreinfo.load(parent.id);
    },
    async description(parent, args, context, info) {
      if (parent.description) {
        return parent.description;
      }
      const manifestation = await context.datasources.openformat.load(
        parent.id
      );
      return (
        getArray(manifestation, "details.abstract.value").map(
          entry => entry.$
        )[0] || ""
      );
    },
    async creators(parent, args, context, info) {
      const manifestation = await context.datasources.openformat.load(
        parent.id
      );
      return getArray(manifestation, "details.creators.value");
    },
    async datePublished(parent, args, context, info) {
      const manifestation = await context.datasources.openformat.load(
        parent.id
      );
      const publication =
        getArray(manifestation, "details.publication.value.$")[0] || "";
      const year = matchYear(publication);
      return (year && year[0]) || "";
    },
    async fullTitle(parent, args, context, info) {
      if (parent.fullTitle) {
        return parent.fullTitle;
      }
      const manifestation = await context.datasources.openformat.load(
        parent.id
      );
      return (
        getArray(manifestation, "details.title.value").map(
          entry => entry.$
        )[0] || ""
      );
    },
    async language(parent, args, context, info) {
      const manifestation = await context.datasources.openformat.load(
        parent.id
      );
      return getArray(manifestation, "details.language.$");
    },

    async materialType(parent, args, context, info) {
      if (parent.materialType) {
        return parent.materialType;
      }
      const manifestation = await context.datasources.openformat.load(
        parent.id
      );
      return getArray(manifestation, "details.materialType.$")[0] || "";
    },

    async physicalDescription(parent, args, context, info) {
      const manifestation = await context.datasources.openformat.load(
        parent.id
      );
      return (
        getArray(manifestation, "details.physicalDescription.value.$")[0] || ""
      );
    },
    pid(parent, args, context, info) {
      return parent.id;
    },
    async recommendations(parent, args, context, info) {
      const recommendations = await context.datasources.recommendations.load({
        pid: parent.id,
        limit: args.limit
      });
      return recommendations.response;
    },
    async title(parent, args, context, info) {
      if (parent.title) {
        return parent.title;
      }
      const manifestation = await context.datasources.openformat.load(
        parent.id
      );
      return (
        getArray(manifestation, "details.title.value").map(
          entry => entry.$
        )[0] || ""
      );
    }
  }
};
