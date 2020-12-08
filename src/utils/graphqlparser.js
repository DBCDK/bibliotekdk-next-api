import { orderBy, uniq } from "lodash";

/**
 * Parse selections tree recursively
 *
 * @param {array} selections
 * @param {array} res
 * @param {array} path
 */
function parseSelections(selections, res = [], path = []) {
  // A selection is an object of some kind
  // we are interested in selections of kind "Field"
  // that have children (object types)
  // if the field has no children it is a simple type (string, number, etc..)
  const selectionsWithChildren = selections.filter(
    selection => selection.selectionSet && selection.selectionSet.selections
  );

  // Loop through selections that are object types
  if (selectionsWithChildren.length > 0) {
    selectionsWithChildren.forEach(selection => {
      // make copy of path
      const currentPath = [...path];
      if (selection.kind === "Field") {
        // this is a field, add its name to path
        currentPath.push(selection.name.value);
      }
      // Recursively parse the children of this field
      parseSelections(selection.selectionSet.selections, res, currentPath);
    });
  } else {
    // We are done processing the path.
    // There are no children that are object types, so we can't go deeper
    res.push(path.join(":"));
  }

  return res;
}

/**
 * Create a concise human readable key for a query
 *
 * We need a way to generate a key for a given query that is readable by a human.
 * We do this by finding paths to all "object types" (not simple types).
 * In this way queries that are similar in terms of how they request the underlying services,
 * generate the same key.
 *
 * This query:
 * {
 *   work(id: "some-workid") {
 *     title
 *     manifestations {
 *       materialType
 *     }
 *     creators {
 *       name
 *     }
 *   }
 * }
 * will generate: "QUERY_work:creators_work:manifestations"
 *
 * Note that paths to the simple types; title, materialType, and name
 * are not in the string.
 *
 * Generated string is prefixed with QUERY_
 *
 * Paths are joined by "_"
 *
 * Paths are sorted before they are joined. Queries with same fields but in different order
 * will generate same string
 *
 * Duplicates of paths are removed
 *
 *
 * @param {array} selections
 */
export function selectionsToKey(selections) {
  return `QUERY_${orderBy(uniq(parseSelections(selections))).join("_")}`;
}
