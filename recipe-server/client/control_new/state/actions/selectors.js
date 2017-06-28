/* eslint import/prefer-default-export: "off" */

export function getAction(state, id, defaultsTo = null) {
  return state.app.actions.items.get(id, defaultsTo);
}
