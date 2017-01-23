this.EXPORTED_SYMBOLS = ["jsonCopy"];

/**
 * Copy a simple object by converting it to JSON and back.
 * @param  {Object} value Value to clone
 * @return {Object}       A deep copy of the value, or the original
 *                        value if it's not an object.
 */
this.jsonCopy = function(value) {
  if (value !== null && typeof value === "object") {
    value = JSON.parse(JSON.stringify(value));
  }
  return value;
};
