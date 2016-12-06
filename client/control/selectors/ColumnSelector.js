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
export const getActiveColumns = columns =>
  [].concat(columns)
    .map(col => (col.enabled ? col : null))
    .filter(col => col);


export const getInactiveColumns = columns =>
  [].concat(columns)
    .map(col => (!col.enabled ? col : null))
    .filter(col => col);

