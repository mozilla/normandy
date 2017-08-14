import { List, Map } from 'immutable';

export function getCountries(state, defaultsTo = new List()) {
  return state.app.countries || defaultsTo;
}
