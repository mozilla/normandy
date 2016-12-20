/**
 * RecipeList column selectors
 */

import cloneArrayValues from 'client/utils/clone-array';

/**
 * Given a set of columns, returns an array of
 * enabled-only/displayed columns
 *
 * @param  {Array<Object>} columns Initial set of columns to look through
 * @return {Array<Object>}         Columns that are enabled/visible to user
 */
export function getActiveColumns(columns) {
  return cloneArrayValues(columns)
    .map(col => (col.enabled ? col : null))
    .filter(col => col);
}

/**
 * Given a set of columns, returns an array of
 * disabled only (hidden) columns
 *
 * @param  {Array<Object>} columns Initial set of columns to look through
 * @return {Array<Object>}         Columns that are disabled/hidden from the user
 */
export function getInactiveColumns(columns) {
  return cloneArrayValues(columns)
    .map(col => (!col.enabled ? col : null))
    .filter(col => col);
}
