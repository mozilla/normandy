import { combineReducers } from 'redux';
import { fromJS, List } from 'immutable';

import {
  EXPERIMENTS_RECEIVE,
  EXPERIMENT_ACCEPTED,
  EXPERIMENT_ALREADY_ACCEPTED,
  EXPERIMENT_REJECTED,
  EXPERIMENT_SELECT_REJECTED,
} from 'control/state/action-types';

export function items(state = new List(), action) {
  switch (action.type) {
    case EXPERIMENTS_RECEIVE:
      return fromJS(action.experiments);
    case EXPERIMENT_ACCEPTED:
    case EXPERIMENT_ALREADY_ACCEPTED:
    case EXPERIMENT_REJECTED:
      return state.filter(e => e.get('experiment_slug') !== action.experiment.get('experiment_slug'));
    default:
      return state;
  }
}

export function rejected(state = null, action) {
  switch (action.type) {
    case EXPERIMENT_SELECT_REJECTED:
      return fromJS(action.experiment);
    default:
      return state;
  }
}

export default combineReducers({
  rejected,
  items,
});
