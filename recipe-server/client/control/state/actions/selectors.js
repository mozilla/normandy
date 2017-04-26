/* eslint import/prefer-default-export: "off" */

export function getAction(state, id, defaultsTo) {
  return state.actions.items.get('id', defaultsTo);
}
