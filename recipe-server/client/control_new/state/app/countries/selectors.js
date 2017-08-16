/* eslint import/prefer-default-export: "off" */
import { List } from 'immutable';

export function getCountries(state, defaultsTo = new List()) {
  return state.app.countries || defaultsTo;
}
