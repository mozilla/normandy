/**
 * Given two objects, deep compares them using JSON.stringify
 *
 * @param  {Object}  obj1 Object to compare
 * @param  {Object}  obj2 Other object to compare
 * @return {Boolean}      Are both objects completely equal?
 */
export default function deepCompare(obj1, obj2) {
  const original = JSON.stringify(obj1);
  const other = JSON.stringify(obj2);

  return original === other;
}
