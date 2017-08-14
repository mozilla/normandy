import { List, Map } from 'immutable';

export function getLocales(state, defaultsTo = new List()) {
  return state.app.locales || defaultsTo;
}
