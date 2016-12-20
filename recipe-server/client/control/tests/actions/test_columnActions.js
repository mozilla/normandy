import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import * as localForage from 'localforage';

import { initialState } from 'control/tests/fixtures';
import * as columnActions from 'control/actions/ColumnActions';

import cloneArrayValues from 'client/utils/clone-array';

const middlewares = [thunk];
const mockStore = configureMockStore(middlewares);
const store = mockStore({ ...initialState });

describe('Column Actions', () => {
  afterEach(() => {
    store.clearActions();
    localForage.clear();
  });

  describe('updateColumn', () => {
    it('creates an UPDATE_COLUMN action', () => {
      const {
        updateColumn,
        UPDATE_COLUMN,
      } = columnActions;

      const expectedAction = {
        type: UPDATE_COLUMN,
        value: 'name',
        isActive: true,
      };

      store.dispatch(updateColumn({ ...expectedAction }));
      expect(store.getActions()).toContain({ ...expectedAction });
    });
  });

  describe('saveLocalColumns', () => {
    it('uses localForage to save column setup locally', async () => {
      const {
        saveLocalColumns,
        localStorageID,
      } = columnActions;

      const testState = { test: true };

      await saveLocalColumns(testState);
      await localForage.getItem(localStorageID)
        .then(found => {
          expect(found).toEqual(testState);
        });
    });
  });

  describe('loadLocalColumns', () => {
    it('should load columns from localForage and put it into the column store', async () => {
      const {
        localStorageID,
        LOAD_SAVED_COLUMNS,
        loadLocalColumns,
      } = columnActions;

      // fake some 'loaded' columns
      const expectedColumns = cloneArrayValues(initialState.columns);
      // add some 'custom' data to check for later
      expectedColumns[0].testProperty = 'should exist';

      // set the fake columns in memory
      await localForage.setItem(localStorageID, expectedColumns);

      // fire the action
      await store.dispatch(loadLocalColumns());

      // check the store
      expect(store.getActions()).toContain({
        type: LOAD_SAVED_COLUMNS,
        columns: expectedColumns,
      });
    });
  });
});
