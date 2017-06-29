import { List } from 'immutable';

export function getUrlParam(state, name) {
  return state.router.params[name];
}

export function getPk(state) {
  return parseInt(getUrlParam(state, 'pk'));
}
