/* eslint import/prefer-default-export: "off" */

export function getSessionHistory(state, count = 5) {
  return state.app.session.history.take(count);
}
