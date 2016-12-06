/**
 * RecipeList column selectors
 */


/**
 * Given a set of columns, returns an array of
 * enabled-only/displayed columns
 *
 * @param  {Array<Object>} columns Initial set of columns to look through
 * @return {Array<Object>}         Columns that are enabled/visible to user
 */
const getActiveColumns = columns =>
  [].concat(columns)
    .map(col => (col.enabled ? col : null))
    .filter(col => col);

// default export to appease linter
export default getActiveColumns;
