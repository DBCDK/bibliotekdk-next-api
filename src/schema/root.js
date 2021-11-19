/**
 * @file Root type definition and resolvers
 *
 */

import { log } from "dbc-node-logger";
import { createHistogram } from "../utils/monitor";
import { resolveOnlineAccess } from "../utils/utils";

/**
 * The root type definitions
 */
export const typeDef = `
type Query {
  manifestation(pid: String!): WorkManifestation!
  monitor(name: String!): String!
  user: User!
  work(id: String!): Work
  works(id: [String!]!): [Work]!
  search(q: SearchQuery!, filters: SearchFilters): SearchResponse!
  suggest(q: String!, worktype: WorkType): SuggestResponse!
  help(q: String!, language: LanguageCode): HelpResponse
  branches(agencyid: String, branchId: String, language: LanguageCode, q: String, offset: Int, limit: PaginationLimit): BranchResult!
  deleteOrder(orderId: String!, orderType: OrderType!): SubmitOrder
  borchk(libraryCode: String!, userId: String!, userPincode: String!): BorchkRequestStatus!
  infomediaContent(pid: String!): [InfomediaContent]
  session: Session
  howru:String
}

type Mutation {
  data_collect(input: DataCollectInput!): String!
  submitPeriodicaArticleOrder(input: PeriodicaArticleOrder!): PeriodicaArticleOrderResponse!
  submitOrder(input: SubmitOrderInput!): SubmitOrder
  submitSession(input: SessionInput!): String!
  deleteSession: String!
}`;

/**
 * Root resolvers
 */
export const resolvers = {
  Query: {
    howru(parent, args, context, info) {
      return "gr8";
    },
    async manifestation(parent, args, context, info) {
      return { id: args.pid };
    },
    async works(parent, args, context, info) {
      return Promise.all(
        args.id.map(async (id) => {
          try {
            const { work } = await context.datasources.workservice.load(id);
            return { ...work, id };
          } catch (e) {
            return null;
          }
        })
      );
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
      return args;
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
    async submitPeriodicaArticleOrder(parent, args, context, info) {
      // User must be logged in at agency
      if (!context.smaug || !context.smaug.user || !context.smaug.user.id) {
        return {
          status: "ERROR_UNAUTHORIZED_USER",
        };
      }

      const agencyId = context.smaug.user.agency;

      // Validate the pickup branch, branch must exist and be part
      // of the agency in which the user logged in
      const branch = (
        await context.datasources.library.load({
          branchId: args.input.pickUpBranch,
        })
      ).result[0];
      if (!branch || branch.agencyId !== agencyId) {
        return {
          status: "ERROR_INVALID_PICKUP_BRANCH",
        };
      }

      // Agency must be subscribed
      const subscriptions = await context.datasources.statsbiblioteketSubscribers.load(
        ""
      );
      if (!subscriptions[agencyId]) {
        return {
          status: "ERROR_AGENCY_NOT_SUBSCRIBED",
        };
      }

      // Pid must be a manifestation with a valid issn (valid journal)
      let issn;
      try {
        const onlineAccess = await resolveOnlineAccess(args.input.pid, context);
        issn = onlineAccess.find((entry) => entry.issn);
      } catch (e) {
        return {
          status: "ERROR_PID_NOT_RESERVABLE",
        };
      }
      if (!issn) {
        return {
          status: "ERROR_PID_NOT_RESERVABLE",
        };
      }

      // We need users name and email
      const user = await context.datasources.user.load({
        accessToken: context.accessToken,
      });

      // Then send order
      try {
        await context.datasources.statsbiblioteketSubmitArticleOrder.load({
          ...args.input,
          user,
        });
        log.info("Periodica article order succes", {
          args,
          accessToken: context.accessToken,
        });
        return { status: "OK" };
      } catch (e) {
        log.error("Periodica article order failed", e);
        return {
          status: "ERROR_PID_NOT_RESERVABLE",
        };
      }
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
