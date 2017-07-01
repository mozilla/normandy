import { getUrlParamAsInt } from 'control_new/state/router/selectors';


export function getCurrentExtensionPk(state) {
  return getUrlParamAsInt(state, 'pk');
}

export function getExtension(state, id, defaultsTo = null) {
  return state.app.extensions.items.get(id, defaultsTo);
}

export function getCurrentExtension(state, defaultsTo = null) {
  const pk = getCurrentExtensionPk(state);
  return getExtension(state, pk, defaultsTo);
}

export function getAllExtensions(state) {
  return state.app.extensions.items;
}
