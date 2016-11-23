export default function closest(el, selector) {
  let matchesFn;

  // find vendor prefix
  ['matches',
    'webkitMatchesSelector',
    'mozMatchesSelector',
    'msMatchesSelector',
    'oMatchesSelector',
  ].some(fn => {
    if (typeof document.body[fn] === 'function') {
      matchesFn = fn;
      return true;
    }
    return false;
  });

  let parent;
  let element = el;

  // traverse parents
  while (element) {
    parent = element.parentElement;
    if (parent && parent[matchesFn](selector)) {
      return parent;
    }
    element = parent;
  }

  return null;
}
