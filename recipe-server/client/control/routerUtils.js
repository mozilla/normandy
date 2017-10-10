export const searchRouteTree = (tree, name, currentUrl = '') => {
  // If we have the slug, we have the complete route.
  if (tree.slug === name) {
    return currentUrl;
  }

  // If the slug doesn't match, iterate over the given route tree until
  // we find one that matches what we need (if any exist).
  for (const curPath of Object.keys(tree)) {
    // A key beginning with '/' indicates it is a route tree, which should be searched.
    if (curPath.charAt(0) === '/') {
      const val = searchRouteTree(tree[curPath], name, currentUrl + curPath);

      // Non-null `val` indicates the route was found.
      if (val !== null) {
        // The base route's slash sometimes leads to `//` showing up in the result URL.
        return val.replace('//', '/');
      }
    }
  }

  // If we've gotten this far, the route has not been found in this route tree.
  return null;
};


// Given a route (e.g. `/hello/:id/there`), finds params that need to be
// populated (e.g. `:id`) and returns a string with populated values.
export const replaceUrlVariables = (url, params) => {
  let newUrl = url;
  const urlParams = url.match(/:[a-z]+/gi);

  if (urlParams) {
    urlParams.forEach(piece => {
      newUrl = newUrl.replace(piece, params[piece.slice(1)] || piece);
    });
  }

  return newUrl;
};
