/**
 * @file DK5 type definition and resolvers
 *
 */

export const typeDef = `
type wikiData {
  IMDb_ID:String
  MUSICBRAINZ_ID:String
  VIAF_ID:String
  FACEBOOK:String
  IMAGE:String
  HOMEPAGE:String
}`;

export const resolvers = {
  wikiData: {
    IMDb_ID(parent, args, context, info) {
      return parent.IMDb_ID.value || "";
    },
    MUSICBRAINZ_ID(parent, args, context, info) {
      return parent.MUSICBRAINZ_ID.value || "";
    },
    VIAF_ID(parent, args, context, info) {
      return parent.VIAF_ID.value || "";
    },
    FACEBOOK(parent, args, context, info) {
      return parent.FACEBOOK.value || "";
    },
    IMAGE(parent, args, context, info) {
      return parent.IMAGE.value || "";
    },
    HOMEPAGE(parent, args, context, info) {
      return parent.HOMEPAGE.value || "";
    },
  },
};
