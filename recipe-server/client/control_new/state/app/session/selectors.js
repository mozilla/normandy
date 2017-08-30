/* eslint import/prefer-default-export: "off" */

export function getSessionHistory(state, category, count = 5) {
  return state.app.session.history
    .filter(item => item.get('category') === category)
    .take(count);
}
