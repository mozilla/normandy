import { getRouterParam } from 'control_new/state/router/selectors';


export function getCurrentExtensionPk(state) {
  return Number.parseInt(getRouterParam(state, 'pk'), 10);
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
