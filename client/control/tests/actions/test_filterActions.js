import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import fetchMock from 'fetch-mock';

import { initialState } from 'control/tests/fixtures';
import { API_REQUEST_SETTINGS } from 'control/actions/ControlActions';
import * as filterActions from 'control/actions/FilterActions';
import { getFilterParamString } from 'control/selectors/FiltersSelector';

const middlewares = [thunk];
const mockStore = configureMockStore(middlewares);
const store = mockStore({ ...initialState });

describe('Filter Actions', () => {
  afterEach(() => {
    expect(fetchMock.calls().unmatched).toEqual([]);
    store.clearActions();
    fetchMock.restore();
  });

  /**
   * loadFilters
   * - creates an LOAD_FILTERS action
   * - should request filters from server
   */
  describe('loadFilters', () => {
    const {
      loadFilters,
      LOAD_FILTERS,
    } = filterActions;

    it('creates an LOAD_FILTERS action', () => {
      const expectedAction = {
        type: LOAD_FILTERS,
        filters: [],
      };

      store.dispatch(loadFilters())
      .then(() => {
        expect(store.getActions()).toContain({ ...expectedAction });
      });
    });

    it('should request filters from server', async () => {
      document.documentElement.dataset.recipeUrl = '/api/v1/filters/';
      fetchMock.get('/api/v1/filters/', []);

      await store.dispatch(loadFilters());

      expect(fetchMock.lastOptions()).toEqual({
        ...API_REQUEST_SETTINGS,
        method: 'GET',
        headers: {
          ...API_REQUEST_SETTINGS.headers,
          Accept: 'application/json',
        },
      });
    });
  });

  describe('selectFilter', () => {
    it('creates a SET_FILTER action by default', () => {
      const {
        selectFilter,
        SET_FILTER,
      } = filterActions;

      const expectedAction = {
        group: {
          value: 'channel',
          label: 'Channel',
          multiple: true,
          options: [],
        },
        option: {
          value: 'aurora',
          label: 'Aurora',
        },
        isEnabled: true,
      };

      store.dispatch(selectFilter({ ...expectedAction }));
      expect(store.getActions()).toContain({
        ...expectedAction,
        type: SET_FILTER,
      });
    });

    it('creates a SET_TEXT_FILTER action if the group/value is "text"', () => {
      const {
        selectFilter,
        SET_TEXT_FILTER,
      } = filterActions;

      const expectedAction = {
        group: {
          value: 'text',
        },
        option: 'this is the search text',
        isEnabled: true,
      };

      store.dispatch(selectFilter({ ...expectedAction }));
      expect(store.getActions()).toContain({
        ...expectedAction,
        type: SET_TEXT_FILTER,
      });
    });
  });

  describe('loadFilteredRecipes', () => {
    const {
      loadFilteredRecipes,
    } = filterActions;

    it('should request recipes from server based on active filters', async () => {
      // build a fake store with filters 'already loaded'
      const filterStore = mockStore({
        ...initialState,
        filters: [{
          value: 'status',
          label: 'Status',
          multiple: false,
          options: [{
            key: 'enabled',
            value: 'Enabled',
            selected: true,
          }],
        }],
      });

      // use a selector to get the param string
      const filterParams = getFilterParamString(filterStore.getState().filters);
      const apiEndpoint = `/api/v1/recipe/?${filterParams}`;

      document.documentElement.dataset.recipeUrl = apiEndpoint;
      fetchMock.get(apiEndpoint, []);

      await filterStore.dispatch(loadFilteredRecipes());

      expect(fetchMock.lastOptions()).toEqual({
        ...API_REQUEST_SETTINGS,
        method: 'GET',
        headers: {
          ...API_REQUEST_SETTINGS.headers,
          Accept: 'application/json',
        },
      });
    });
  });

  describe('setAllFilters', () => {
    it('should create a SET_ALL_FILTERS action', () => {
      const {
        setAllFilters,
        SET_ALL_FILTERS,
      } = filterActions;

      const filters = [{
        value: 'test',
        label: 'Test',
      }, {
        value: 'test2',
        label: 'Test 2',
      }];

      store.dispatch(setAllFilters(filters));
      expect(store.getActions()).toContain({
        type: SET_ALL_FILTERS,
        filters,
      });
    });
  });

  describe('resetFilters', () => {
    it('should create an empty SET_ALL_FILTERS action', () => {
      const {
        resetFilters,
        SET_ALL_FILTERS,
      } = filterActions;

      store.dispatch(resetFilters());

      expect(store.getActions()).toContain({
        type: SET_ALL_FILTERS,
        filters: undefined,
      });
    });
  });
});
