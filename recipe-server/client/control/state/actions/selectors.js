/* eslint import/prefer-default-export: "off" */

export function getAction(state, id, defaultsTo) {
  return state.getIn(['actions', 'items', id], defaultsTo);
}
