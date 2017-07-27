import { List } from 'immutable';

export function getExperiments(state) {
  return state.app.experiments.items.get('experiments', new List());
}

export function getRejectedExperiment(state) {
  return state.app.experiments.items.get('rejected_experiment', null);
}
