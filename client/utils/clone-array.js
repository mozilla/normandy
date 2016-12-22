/**
 * Utility function to detect if the argument passed
 * is an array or not. Throws an error if it is NOT an array.
 *
 * @param  {Array?} arr Object to determine is an array
 */
function ensureArray(arr) {
  if (arr && !(arr instanceof Array)) {
    throw new Error('cloneArrayValues was not given an array');
  }
}

/**
 * Given an array, clones items _by value_
 * and returns a new array instance.
 *
 * @param  {Array}  arr Array of values to clone
 * @return {Array}      New array of new values
 */
export default function cloneArrayValues(arr) {
  ensureArray(arr);

  return JSON.parse(JSON.stringify(arr || []));
}

/**
 * Given an array, clones items _by reference_
 * and returns a new array instance.
 *
 * @param  {Array}  arr Array of references to clone
 * @return {Array}      New array with references
 */
export function cloneArrayRefs(arr) {
  ensureArray(arr);

  return [].concat(arr || []);
}
