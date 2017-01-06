/**
 * Given an array, clones items _by value_
 * and returns a new array instance.
 *
 * @param  {Array}  arr Array of values to clone
 * @return {Array}      New array of new values
 */
export default function cloneArrayValues(arr) {
  return JSON.parse(JSON.stringify(arr));
}
