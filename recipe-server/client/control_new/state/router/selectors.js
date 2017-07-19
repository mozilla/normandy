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
