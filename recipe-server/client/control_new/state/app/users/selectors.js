/* eslint import/prefer-default-export: "off" */

export function getUser(state, id, defaultsTo = null) {
  return state.app.users.items.get(id, defaultsTo);
}
