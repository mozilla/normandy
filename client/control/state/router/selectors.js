import { replaceUrlVariables } from 'control/routerUtils';

export function getUrlParam(state, name, defaultsTo) {
  return state.router.params[name] || defaultsTo;
}

export function getUrlParamAsInt(state, name, defaultsTo) {
  return parseInt(getUrlParam(state, name, defaultsTo), 10);
}

export function getQueryParam(state, key, defaultsTo) {
  return state.router.query[key] || defaultsTo;
}

export function getQueryParamAsInt(state, key, defaultsTo) {
  return parseInt(getQueryParam(state, key, defaultsTo), 10);
}

export function getCurrentURL(state, queryParams) {
  return {
    pathname: state.router.pathname,
    query: {
      ...state.router.query,
      ...queryParams,
    },
  };
}

export function getRouterPath(state) {
  return state.router.pathname;
}

export function getFullyQualifiedCurrentURL(state, queryParams) {
  const { pathname } = getCurrentURL(state, queryParams);
  return `${window.location.protocol}//${window.location.host}${pathname}`;
}

export function getBreadcrumbs(state) {
  const { result, pathname, params } = state.router;
  const crumbs = [];
  let currentRoute = result;

  while (currentRoute) {
    if (currentRoute.crumb) {
      let link = replaceUrlVariables(currentRoute.route || pathname, params);
      if (!link.endsWith('/')) {
        link += '/';
      }
      crumbs.push({
        name: currentRoute.crumb,
        link,
      });
    }
    currentRoute = currentRoute.parent;
  }

  return crumbs.reverse();
}
