/**
 * Given an element and a query selector ('.class', '#whatever', etc),
 * climbs the DOM tree from the given el to determine if there is an element
 * that matches that selector, and if so, returns a reference to that element.
 *
 * @param  {Element}  el       Child element to traverse from
 * @param  {String}   selector DOM query selector to search for
 * @return {Element?}          Element that matches selector, if any
 */
export default function closest(el, selector) {
  let matchesFn;

  // find the 'matches' selector for this browser
  // (it may have a prefix, so we check
  // all possibilities)
  [
    'matches',
    'mozMatchesSelector',
  ].find(fn => {
    if (typeof document.body[fn] === 'function') {
      matchesFn = fn;
      return true;
    }
    return false;
  });

  let parent;
  let element = el;

  // while we have an element selected,
  // keep climbing up the DOM
  while (element) {
    parent = element.parentElement;
    // if a parent exists and it matches the selector we need,
    if (parent && parent[matchesFn](selector)) {
      // return that element
      return parent;
    }
    // otherwise, keep going up the DOM
    element = parent;
  }

  // if we haven't returned anything by now,
  // the element doesn't exist
  return null;
}
