/* eslint import/prefer-default-export: "off" */
import { List } from 'immutable';

export function getChannels(state, defaultsTo = new List()) {
  return state.app.channels || defaultsTo;
}
