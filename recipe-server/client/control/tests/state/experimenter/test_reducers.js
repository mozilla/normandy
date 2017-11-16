import { fromJS, Map } from 'immutable';
import * as matchers from 'jasmine-immutable-matchers';

import {
  EXPERIMENTS_RECEIVE,
  EXPERIMENT_ACCEPTED,
  EXPERIMENT_ALREADY_ACCEPTED,
  EXPERIMENT_REJECTED,
  EXPERIMENT_SELECT_REJECTED,
} from 'control/state/action-types';
import experimentsReducer from 'control/state/app/experimenter/reducers';
import ExperimentFactory, {
  INITIAL_STATE,
} from 'control/tests/state/experimenter';

beforeEach(() => {
  jasmine.addMatchers(matchers);
});

describe('Experiments reducer', () => {
  it('should return initial state by default', () => {
    expect(experimentsReducer(INITIAL_STATE, {})).toEqual(INITIAL_STATE);
  });

  it('should handle EXPERIMENTS_RECEIVE', () => {
    const experiments = ExperimentFactory.buildMany(3);

    const updatedState = experimentsReducer(INITIAL_STATE, {
      type: EXPERIMENTS_RECEIVE,
      experiments,
    });

    expect(updatedState.items.get('experiments')).toEqualImmutable(fromJS(experiments));
  });

  it('should filter out experiment on EXPERIMENT_ACCEPTED', () => {
    const experiments = ExperimentFactory.buildMany(3);
    const acceptedExperiment = experiments[0];

    const state = experimentsReducer(INITIAL_STATE, {
      type: EXPERIMENTS_RECEIVE,
      experiments,
    });

    expect(state.items.get('experiments').size).toEqual(3);

    const filteredState = experimentsReducer(state, {
      type: EXPERIMENT_ACCEPTED,
      experiment: acceptedExperiment,
    });

    const filteredExperiments = new Map(filteredState.items.get('experiments').map(experiment => [experiment.get('experiment_slug'), experiment]));
    expect(filteredExperiments.size).toEqual(2);
    expect(filteredExperiments.get(acceptedExperiment.experiment_slug)).toBeUndefined();
  });

  it('should filter out experiment on EXPERIMENT_ALREADY_ACCEPTED', () => {
    const experiments = ExperimentFactory.buildMany(3);
    const acceptedExperiment = experiments[0];

    const state = experimentsReducer(INITIAL_STATE, {
      type: EXPERIMENTS_RECEIVE,
      experiments,
    });

    expect(state.items.get('experiments').size).toEqual(3);

    const filteredState = experimentsReducer(state, {
      type: EXPERIMENT_ALREADY_ACCEPTED,
      experiment: acceptedExperiment,
    });

    const filteredExperiments = new Map(filteredState.items.get('experiments').map(experiment => [experiment.get('experiment_slug'), experiment]));
    expect(filteredExperiments.size).toEqual(2);
    expect(filteredExperiments.get(acceptedExperiment.experiment_slug)).toBeUndefined();
  });

  it('should set rejected_experiment on EXPERIMENT_SELECT_REJECTED', () => {
    const experiment = ExperimentFactory.build();

    const state = experimentsReducer(INITIAL_STATE, {
      type: EXPERIMENT_SELECT_REJECTED,
      experiment,
    });

    expect(state.items.get('rejected_experiment')).toEqualImmutable(fromJS(experiment));
  });

  it('should filter out experiment on EXPERIMENT_REJECTED', () => {
    const experiments = ExperimentFactory.buildMany(3);
    const rejectedExperiment = experiments[0];

    const state = experimentsReducer(INITIAL_STATE, {
      type: EXPERIMENTS_RECEIVE,
      experiments,
    });

    expect(state.items.get('experiments').size).toEqual(3);

    const filteredState = experimentsReducer(state, {
      type: EXPERIMENT_REJECTED,
      experiment: rejectedExperiment,
    });

    const filteredExperiments = new Map(filteredState.items.get('experiments').map(experiment => [experiment.get('experiment_slug'), experiment]));
    expect(filteredExperiments.size).toEqual(2);
    expect(filteredExperiments.get(rejectedExperiment.experiment_slug)).toBeUndefined();
  });
});
