import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import fetchMock from 'fetch-mock';

import {
  initialState,
  stubbedFilters,
} from 'control/tests/fixtures';

import { API_REQUEST_SETTINGS } from 'control/api';
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

    it('creates an LOAD_FILTERS action', async () => {
      const expectedAction = {
        type: LOAD_FILTERS,
        filters: stubbedFilters,
      };

      fetchMock.get('/api/v1/filters/', {
        body: {
          status: [{
            key: 'enabled',
            value: 'Enabled',
          }, {
            key: 'disabled',
            value: 'Disabled',
          }],
        },
      });

      await store.dispatch(loadFilters());
      expect(store.getActions()).toContain(expectedAction);
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
        filters: {
          list: [{
            value: 'status',
            label: 'Status',
            multiple: false,
            options: [{
              key: 'enabled',
              value: 'Enabled',
            }],
          }],
          active: [{
            value: 'status',
            label: 'Status',
            multiple: false,
            options: [{
              key: 'enabled',
              value: 'Enabled',
              selected: true,
            }],
          }],
        },
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

  describe('resetFilters', () => {
    it('should create a RESET_FILTERS action', () => {
      const {
        resetFilters,
        RESET_FILTERS,
      } = filterActions;

      store.dispatch(resetFilters());

      expect(store.getActions()).toContain({
        type: RESET_FILTERS,
      });
    });
  });
});
