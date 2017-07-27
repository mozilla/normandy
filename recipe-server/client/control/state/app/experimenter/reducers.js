import { combineReducers } from 'redux';
import { fromJS, Map, List } from 'immutable';

import {
  EXPERIMENTS_RECEIVE,
  EXPERIMENT_ACCEPTED,
  EXPERIMENT_ALREADY_ACCEPTED,
  EXPERIMENT_REJECTED,
  EXPERIMENT_SELECT_REJECTED,
} from 'control/state/action-types';

function filterExperiments(state, slug) {
  return state.update('experiments', new List(), experiments => experiments.filter(e => e.get('experiment_slug') !== slug));
}

export function getInitialState() {
  return new Map()
    .set('experiments', new List())
    .set('rejected_experiment', null);
}

function items(state = getInitialState(), action) {
  switch (action.type) {
    case EXPERIMENTS_RECEIVE:
      return state.set('experiments', fromJS(action.experiments));
    case EXPERIMENT_ACCEPTED:
      return filterExperiments(state, action.experiment.experiment_slug);
    case EXPERIMENT_ALREADY_ACCEPTED:
      return filterExperiments(state, action.experiment.experiment_slug);
    case EXPERIMENT_SELECT_REJECTED:
      return state.set('rejected_experiment', fromJS(action.experiment));
    case EXPERIMENT_REJECTED:
      return filterExperiments(state, action.experiment.experiment_slug);
    default:
      return state;
  }
}

export default combineReducers({
  items,
});
