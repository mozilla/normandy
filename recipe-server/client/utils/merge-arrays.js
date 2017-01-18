import {
  flatten,
  uniq,
  property,
} from 'underscore';

/**
 * Given a property string, returns a function
 * that accepts multiple arrays as parameters,
 * merges those arrays, then dedupes objects based
 * on the property originally given
 *
 * @param  {String}    prop   Property to use to dedupe arrays of objects
 * @return {Function}         Function accepting arrays to merge
 */
export default function mergeByKey(prop) {
  if (!prop || typeof prop !== 'string') {
    throw new Error('mergeByKey requires `prop` to be a string.');
  }
  /**
   * Given multiple arrays, concats and dedupes the objects
   * inside of that array based on the `prop` already passed in.
   *
   * @param  {...Array<Object>} arrs  Arrays to merge and dedupe
   * @return {Array}                  Merged array without duplicate objects
   */
  return (...arrs) => {
    // combine all arrays passed in
    let compiled = flatten(arrs);

    // we need to reverse the arrays since `uniq` merges left-to-right,
    // and we want to merge right-to-left.
    compiled = compiled.reverse();

    // then use the given prop string to
    // dedupe the objects within the array
    compiled = uniq(compiled, false, property(prop));

    // re-reverse the array to be in the order that was sent in
    compiled = compiled.reverse();

    // return the merged and de-duped array
    return compiled;
  };
}
