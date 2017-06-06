/* eslint import/prefer-default-export: "off" */

export function getExtension(state, id, defaultsTo = null) {
  return state.newState.extensions.items.get(id, defaultsTo);
}
