/**
 * Localizations + HoldingsItem type definitions
 */
export const typeDef = `
type Lamp{
  color:String
  message: String
}
type DetailedHoldings {
  count: Int!
  branchId: String
  expectedDelivery: String
  agencyHoldings: [AgencyHolding]
  holdingItems: [Status]
  lamp: Lamp
}
type AgencyHolding{
  localisationPid: String
  localIdentifier: String
  agencyId: String
}
type Status{
  branch: String
  branchId: String
  willLend: String
  expectedDelivery: String
  localHoldingsId: String
  circulationRule: String
  department: String
  issueId: String
  issueText: String
  location: String
  note: String
  readyForLoan: String
  status: String
  subLocation: String
}`;

export const resolvers = {
  DetailedHoldings: {
    count(parent, args, context, info) {
      return parent.holdingstatus.length || 0;
    },
    branchId(parent, args, context, info) {
      return parent.branchId;
    },
    holdingItems(parent, args, context, info) {
      return parent.holdingstatus;
    },
    expectedDelivery(parent, args, context, info) {
      // return newest delivery date
      console.log(parent.holdingstatus, "HOLDINGSTATUS");
      return new Date().toJSON().slice(0, 10).replace(/-/g, "/");
    },
    lamp(parent, args, context, info) {
      let statusobject = { message: "no_loc_no_holding", color: "none" };
      //check if there are any localizations at all
      if (parent.agencyHoldings === null) {
        // no localizations - we can do nothing
        return statusobject;
      }
      // branch has no holding - there are localizations in agency
      if (parent.holdingstatus.length < 1) {
        return { message: "loc_no_holding", color: "green" };
      }
      // branch has holding - check status
      // if we find a 'green' lamp all is good
      // yellow is second best
      parent.holdingstatus.every((hold) => {
        if (hold.status === "OnShelf") {
          statusobject = { message: "at_home", color: "green" };
          // break every loop
          return false;
        }
        if (hold.status === "OnLoan") {
          statusobject = {
            message: hold.expectedDelivery || "",
            color: "yellow",
          };
        }
        if (hold.status === "NotForLoan") {
          // we will rather return yellow than red
          if (statusobject.color !== "yellow") {
            statusobject = { message: "not_for_loan", color: "red" };
          }
        }
        // continue every loop
        return true;
      });

      return statusobject;
    },
    agencyHoldings(parent, args, context, info) {
      return parent.agencyHoldings;
    },
  },
  AgencyHolding: {
    localisationPid(parent, args, context, info) {
      return parent.localisationPid;
    },
    localIdentifier(parent, args, context, info) {
      return parent.localIdentifier;
    },
    agencyId(parent, args, context, info) {
      return parent.agency;
    },
  },
  Status: {
    branch(parent, args, context, info) {
      return parent.branch;
    },
    branchId(parent, args, context, info) {
      return parent.branchId;
    },
    willLend(parent, args, context, info) {
      return parent.willLend;
    },
    expectedDelivery(parent, args, context, info) {
      return parent.expectedDelivery;
    },
    localHoldingsId(parent, args, context, info) {
      return parent.localHoldingsId;
    },
    circulationRule(parent, args, context, info) {
      return parent.circulationRule;
    },
    department(parent, args, context, info) {
      return parent.department;
    },
    issueId(parent, args, context, info) {
      return parent.issueId;
    },
    issueText(parent, args, context, info) {
      return parent.issueText;
    },
    location(parent, args, context, info) {
      return parent.location;
    },
    note(parent, args, context, info) {
      return parent.note;
    },
    readyForLoan(parent, args, context, info) {
      return parent.readyForLoan;
    },
    status(parent, args, context, info) {
      return parent["status"];
    },
    subLocation(parent, args, context, info) {
      return parent.subLocation;
    },
  },
};
