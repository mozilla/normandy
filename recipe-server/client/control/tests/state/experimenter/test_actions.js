import { fromJS } from 'immutable';
import * as matchers from 'jasmine-immutable-matchers';
import fetchMock from 'fetch-mock';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import {
  acceptExperiment,
  fetchExperiments,
  getPendingExperimentsUrl,
  importExperiment,
  rejectExperiment,
  selectRejectedExperiment,
} from 'control/state/app/experimenter/actions';

import { ActionFactory } from 'control/tests/state/actions';

import ExperimentFactory, {
  createRecipeResponse,
} from 'control/tests/state/experimenter';

import {
  EXPERIMENTS_RECEIVE,
  EXPERIMENT_ACCEPTED,
  EXPERIMENT_REJECTED,
  EXPERIMENT_SELECT_REJECTED,
  RECIPE_RECEIVE,
} from 'control/state/action-types';

const middlewares = [thunk];
const mockStore = configureStore(middlewares);

beforeEach(() => {
  jasmine.addMatchers(matchers);
});

afterEach(() => {
  fetchMock.restore();
});

describe('Experimenter Actions fetchExperiments', () => {
  it('should fetch experiments from experimenter', async () => {
    const store = mockStore({});
    const experiments = ExperimentFactory.buildMany(3);
    const experimenterAPIUrl = 'https://experimenter.test/api/v1';
    const pendingExperimentsUrl = getPendingExperimentsUrl(experimenterAPIUrl);
    fetchMock.get(pendingExperimentsUrl, experiments);

    await store.dispatch(fetchExperiments(experimenterAPIUrl));

    expect(fetchMock.called(pendingExperimentsUrl)).toBeTruthy();

    const actions = store.getActions();
    expect(actions.length).toEqual(1);

    const action = actions[0];
    expect(action.type).toEqual(EXPERIMENTS_RECEIVE);
    expect(fromJS(action.experiments)).toEqualImmutable(fromJS(experiments));
  });
});

describe('Experimenter Actions acceptExperiment', () => {
  it('should call the accept url of an experiment', async () => {
    const store = mockStore({});
    const acceptUrl = 'https://www.example.com/experiment/accept/';
    const experiment = fromJS(ExperimentFactory.build({ accept_url: acceptUrl }));
    fetchMock.mock(acceptUrl, 'accepted', { method: 'PATCH' });

    await store.dispatch(acceptExperiment(experiment));

    expect(fetchMock.called(acceptUrl)).toBeTruthy();

    const actions = store.getActions();
    expect(actions.length).toEqual(1);

    const action = actions[0];
    expect(action.type).toEqual(EXPERIMENT_ACCEPTED);
  });
});

describe('Experimenter Actions importExperiment', () => {
  it('should send experiment to normandy and send accept to experimenter', async () => {
    const store = mockStore({
      app: { requests: { get: () => ({}) } },
    });

    const action = fromJS(ActionFactory.build());
    const acceptUrl = 'https://www.example.com/experiment/accept/';
    const experiment = fromJS(ExperimentFactory.build({ accept_url: acceptUrl }));
    const createRecipeURL = '/api/v2/recipe/';
    const recipeResponse = createRecipeResponse(experiment);

    fetchMock.mock(createRecipeURL, recipeResponse, { method: 'POST' });
    fetchMock.mock(acceptUrl, 'accepted', { method: 'PATCH' });

    await store.dispatch(importExperiment(experiment, action));

    expect(fetchMock.called(createRecipeURL)).toBeTruthy();
    expect(fetchMock.called(acceptUrl)).toBeTruthy();

    const actions = new Map(store.getActions().map(a => [a.type, a]));

    const experimentAcceptedAction = actions.get(EXPERIMENT_ACCEPTED);
    expect(fromJS(experimentAcceptedAction.experiment)).toEqualImmutable(experiment);

    const recipeReceivedAction = actions.get(RECIPE_RECEIVE);
    expect(fromJS(recipeReceivedAction.recipe)).toEqualImmutable(fromJS(recipeResponse));
  });
});

describe('Experimenter Actions selectRejectedExperiment', () => {
  it('should dispatch an action', async () => {
    const store = mockStore({});
    const experiment = fromJS(ExperimentFactory.build());

    await store.dispatch(selectRejectedExperiment(experiment));

    const actions = store.getActions();
    expect(actions.length).toEqual(1);

    const action = actions[0];
    expect(action.type).toEqual(EXPERIMENT_SELECT_REJECTED);
    expect(action.experiment).toEqualImmutable(experiment);
  });
});

describe('Experimenter Actions rejectExperiment', () => {
  it('should send the rejection to experimenter and set the rejected experiment to null', async () => {
    const store = mockStore({});
    const rejectUrl = 'https://www.example.com/experiment/reject/';
    const experiment = fromJS(ExperimentFactory.build({ reject_url: rejectUrl }));

    fetchMock.mock(rejectUrl, 'rejected', { method: 'PATCH' });

    await store.dispatch(rejectExperiment(experiment));

    expect(fetchMock.called(rejectUrl)).toBeTruthy();

    const actions = new Map(store.getActions().map(action => [action.type, action]));

    const selectRejectedAction = actions.get(EXPERIMENT_SELECT_REJECTED);
    expect(selectRejectedAction.experiment).toEqual(null);

    const rejectedAction = actions.get(EXPERIMENT_REJECTED);
    expect(fromJS(rejectedAction.experiment)).toEqualImmutable(fromJS(experiment));
  });
});
