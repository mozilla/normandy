/**
* Utility function to remove a set of properties
* from a given object.
*
* @param  {Object}         object Object to remove props form
* @param  {Array<string>}  list   List of properties to remove
* @return {Object}         New object without selected properties
*/
export default function removeProps(object, list) {
  const newObject = { ...object };

  for (const property of list) {
    delete newObject[property];
  }

  return newObject;
}
