/* eslint import/prefer-default-export: "off" */

export function getRevision(state, id, defaultsTo) {
  return state.getIn(['revisions', 'items', id], defaultsTo);
}
