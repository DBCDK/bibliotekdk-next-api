import {makeExecutableSchema} from 'graphql-tools';
import {
  typeDef as Manifestation,
  resolvers as ManifestationResolvers
} from './manifestation';
import {
  typeDef as Recommendation,
  resolvers as RecommendationResolvers
} from './recommendation';
import {typeDef as Creator, resolvers as CreatorResolvers} from './creator';
import {
  typeDef as SearchQuery,
  resolvers as SearchQueryResolvers
} from './searchquery';
import {
  typeDef as AdminData,
  resolvers as AdminDataResolvers
} from './admindata';
import {typeDef as Cover, resolvers as CoverResolvers} from './cover';

const schema = makeExecutableSchema({
  typeDefs: [
    `type Query {
      manifestation(pid: String!): Manifestation!
    }`,
    Manifestation,
    Recommendation,
    Creator,
    SearchQuery,
    AdminData,
    Cover
  ],
  resolvers: {
    Query: {
      manifestation(parent, args, context, info) {
        return {pid: args.pid};
      }
    },
    ...ManifestationResolvers,
    ...RecommendationResolvers,
    ...CreatorResolvers,
    ...SearchQueryResolvers,
    ...AdminDataResolvers,
    ...CoverResolvers
  }
});

export default schema;
