/* eslint import/prefer-default-export: "off" */

export function getRevision(state, id, defaultsTo) {
  return state.newState.revisions.items.get(id, defaultsTo);
}
