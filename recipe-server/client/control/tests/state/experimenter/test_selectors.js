import { fromJS } from 'immutable';
import * as matchers from 'jasmine-immutable-matchers';

import {
  EXPERIMENTS_RECEIVE,
  EXPERIMENT_SELECT_REJECTED,
} from 'control/state/action-types';
import experimentsReducer from 'control/state/app/experimenter/reducers';
import {
 getExperiments,
 getRejectedExperiment,
} from 'control/state/app/experimenter/selectors';

import ExperimentFactory from 'control/tests/state/experimenter';

beforeEach(() => {
  jasmine.addMatchers(matchers);
});

describe('getExperiments', () => {
  it('should return experiments', () => {
    const experiments = ExperimentFactory.buildMany(3);
    const state = {
      app: {
        experiments: experimentsReducer(undefined, {
          type: EXPERIMENTS_RECEIVE,
          experiments,
        }),
      },
    };

    expect(getExperiments(state)).toEqualImmutable(fromJS(experiments));
  });
});

describe('getRejectedExperiment', () => {
  it('should return the rejected experiment', () => {
    const experiment = ExperimentFactory.build();
    const state = {
      app: {
        experiments: experimentsReducer(undefined, {
          type: EXPERIMENT_SELECT_REJECTED,
          experiment,
        }),
      },
    };

    expect(getRejectedExperiment(state)).toEqualImmutable(fromJS(experiment));
  });
});
