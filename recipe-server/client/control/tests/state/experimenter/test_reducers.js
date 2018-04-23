import { fromJS, List } from 'immutable';
import * as matchers from 'jasmine-immutable-matchers';

import {
  EXPERIMENTS_RECEIVE,
  EXPERIMENT_ACCEPTED,
  EXPERIMENT_REJECTED,
  EXPERIMENT_SELECT_REJECTED,
} from 'control/state/action-types';
import {
  items as experimentsReducer,
  rejected as rejectedReducer,
} from 'control/state/app/experimenter/reducers';
import ExperimentFactory from 'control/tests/state/experimenter';

beforeEach(() => {
  jasmine.addMatchers(matchers);
});

describe('Experiments Reducer', () => {
  const experiments = ExperimentFactory.buildMany(3);
  const INITIAL_STATE = experimentsReducer(new List(), {
    type: EXPERIMENTS_RECEIVE,
    experiments,
  });

  it('should return initial state by default', () => {
    expect(experimentsReducer(INITIAL_STATE, {})).toEqual(INITIAL_STATE);
  });

  it('should return experiments on EXPERIMENTS_RECEIVE', () => {
    expect(INITIAL_STATE).toEqualImmutable(fromJS(experiments));
  });

  it('should filter out experiment on EXPERIMENT_ACCEPTED', () => {
    const acceptedExperiment = fromJS(ExperimentFactory.build());
    const otherExperiments = ExperimentFactory.buildMany(2);
    const allExperiments = otherExperiments.concat([acceptedExperiment]);

    const state = experimentsReducer(new List(), {
      type: EXPERIMENTS_RECEIVE,
      experiments: allExperiments,
    });

    expect(state).toEqualImmutable(fromJS(allExperiments));

    const filteredState = experimentsReducer(state, {
      type: EXPERIMENT_ACCEPTED,
      experiment: acceptedExperiment,
    });

    expect(filteredState).toEqualImmutable(fromJS(otherExperiments));
  });
  it('should filter out experiment on EXPERIMENT_REJECTED', () => {
    const rejectedExperiment = fromJS(ExperimentFactory.build());
    const otherExperiments = ExperimentFactory.buildMany(2);
    const allExperiments = otherExperiments.concat([rejectedExperiment]);

    const state = experimentsReducer(new List(), {
      type: EXPERIMENTS_RECEIVE,
      experiments: allExperiments,
    });

    expect(state).toEqualImmutable(fromJS(allExperiments));

    const filteredState = experimentsReducer(state, {
      type: EXPERIMENT_REJECTED,
      experiment: rejectedExperiment,
    });

    expect(filteredState).toEqualImmutable(fromJS(otherExperiments));
  });
});

describe('Rejected Experiments Reducer', () => {
  it('should set rejected_experiment on EXPERIMENT_SELECT_REJECTED', () => {
    const INITIAL_STATE = null;
    const experiment = ExperimentFactory.build();

    const state = rejectedReducer(INITIAL_STATE, {
      type: EXPERIMENT_SELECT_REJECTED,
      experiment,
    });

    expect(state).toEqualImmutable(fromJS(experiment));
  });
});
