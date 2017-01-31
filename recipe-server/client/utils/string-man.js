/* eslint-disable import/prefer-default-export */

/**
 * Capitalizes the first letter in a string.
 *
 * @param  {String} value String to capitalize.
 * @return {String}       String with capitalized first letter.
 */
export function capitalizeFirst(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
