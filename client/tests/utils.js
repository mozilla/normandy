/* eslint-disable import/prefer-default-export */
/**
 * Create a fetch-mock matcher that matches URLs based on their path
 * alone.
 * @param  {String} urlToMatch URL path to match against (including leading /)
 * @return {Function}          Function for use as a fetch-mock matcher.
 */
export function urlPathMatcher(path) {
  return url => {
    const parsedUrl = new URL(url);
    return parsedUrl.pathname === path;
  };
}
