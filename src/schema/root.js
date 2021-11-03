/**
 * @file Root type definition and resolvers
 *
 */

import { log } from "dbc-node-logger";
import { createHistogram } from "../utils/monitor";

/**
 * The root type definitions
 */
export const typeDef = `
type Query {
  manifestation(pid: String!): WorkManifestation!
  monitor(name: String!): String!
  user: User!
  work(id: String!): Work
  search(q: String!, limit: PaginationLimit!, offset: Int, facets: [FacetFilter]): SearchResponse!
  suggest(q: String!, worktype: WorkType): SuggestResponse!
  help(q: String!, language: LanguageCode): HelpResponse
  branches(agencyid: String, branchId: String, language: LanguageCode, q: String, offset: Int, limit: PaginationLimit): BranchResult!
  deleteOrder(orderId: String!, orderType: OrderType!): SubmitOrder
  borchk(libraryCode: String!, userId: String!, userPincode: String!): BorchkRequestStatus!
  infomediaContent(pid: String!): [InfomediaContent]
  session: Session
  dbpedia(wikiDataId: String!): dbPedia
  wikidata(wikiDataId: String!): wikiData
}

type Mutation {
  data_collect(input: DataCollectInput!): String!
  submitOrder(input: SubmitOrderInput!): SubmitOrder
  submitSession(input: SessionInput!): String!
  deleteSession: String!
}`;

/**
 * Root resolvers
 */
export const resolvers = {
  Query: {
    async dbpedia(parent, args, context, info) {
      return {...args}
    },

    async wikidata(parent, args, context, info) {
      const {bindings} = await context.datasources.wikidata.load("Q202693");

      console.log(bindings, "BINDING");

      return {...bindings[0]}
    },

    async manifestation(parent, args, context, info) {
      return { id: args.pid };
    },
    monitor(parent, args, context, info) {
      try {
        context.monitorName = args.name;
        createHistogram(args.name);
        return "OK";
      } catch (e) {
        return e.message;
      }
    },
    async help(parent, args, context, info) {
      return { ...args };
    },
    async user(parent, args, context, info) {
      return { ...args };
    },
    async work(parent, args, context, info) {
      const { work } = await context.datasources.workservice.load(args.id);
      return { ...work, id: args.id };
    },
    async search(parent, args, context, info) {
      return {
        q: args.q,
        limit: args.limit,
        offset: args.offset,
        facets: args.facets,
      };
    },
    async branches(parent, args, context, info) {
      return await context.datasources.library.load({
        q: args.q,
        limit: args.limit,
        offset: args.offset,
        language: args.language,
        agencyid: args.agencyid,
        branchId: args.branchId,
      });
    },
    async suggest(parent, args, context, info) {
      return { q: args.q, worktype: args.worktype };
    },
    async deleteOrder(parent, args, context, info) {
      return await context.datasources.deleteOrder.load({
        orderId: args.orderId,
        orderType: args.orderType,
        accessToken: context.accessToken,
      });
    },
    async borchk(parent, args, context, info) {
      return context.datasources.borchk.load({
        libraryCode: args.libraryCode,
        userId: args.userId,
        userPincode: args.userPincode,
      });
    },
    async infomediaContent(parent, args, context, info) {
      return await context.datasources.infomedia.load({
        pid: args.pid,
        accessToken: context.accessToken,
      });
    },
    async session(parent, args, context, info) {
      return await context.datasources.session.load({
        accessToken: context.accessToken,
      });
    },
  },
  Mutation: {
    data_collect(parent, args, context, info) {
      // Check that exactly one input type is given
      const inputObjects = Object.values(args.input);
      if (inputObjects.length !== 1) {
        throw new Error("Exactly 1 input must be specified");
      }

      // Convert keys, replace _ to -
      const data = {};
      Object.entries(inputObjects[0]).forEach(([key, val]) => {
        data[key.replace(/_/g, "-")] = val;
      });

      // We log the object, setting 'type: "data"' on the root level
      // of the log entry. In this way the data will be collected
      // by the AI data collector
      log.info("data", { type: "data", message: JSON.stringify(data) });

      return "OK";
    },
    async submitOrder(parent, args, context, info) {
      const input = {
        ...args.input,
        accessToken: context.accessToken,
        smaug: context.smaug,
        branch: (
          await context.datasources.library.load({
            branchId: args.input.pickUpBranch,
          })
        ).result[0],
      };

      return await context.datasources.submitOrder.load(input);
    },
    async submitSession(parent, args, context, info) {
      await context.datasources.submitSession.load({
        accessToken: context.accessToken,
        session: args.input,
      });
      return "OK";
    },
    async deleteSession(parent, args, context, info) {
      await context.datasources.deleteSession.load({
        accessToken: context.accessToken,
      });
      return "OK";
    },
  },
};
