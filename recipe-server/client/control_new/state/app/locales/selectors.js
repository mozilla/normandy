/* eslint import/prefer-default-export: "off" */
import { List } from 'immutable';

export function getLocales(state, defaultsTo = new List()) {
  return state.app.locales || defaultsTo;
}
