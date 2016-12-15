import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import * as localForage from 'localforage';

import { initialState } from 'control/tests/fixtures';
import * as columnActions from 'control/actions/ColumnActions';

import cloneArrayValues from 'client/utils/clone-array-values';

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
    it('uses localForage to save column setup locally', done => {
      const {
        saveLocalColumns,
        localStorageID,
      } = columnActions;

      const testState = { test: true };

      saveLocalColumns(testState, () => {
        localForage.getItem(localStorageID, (err, found) => {
          expect(err).toBeNull();
          expect(found).toEqual(testState);
          done();
        });
      });
    });
  });

  describe('loadLocalColumns', () => {
    it('should load column setup from localForage and put it into the column store', done => {
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
      localForage.setItem(localStorageID, expectedColumns)
        .then(() =>
          // fire the action
          store.dispatch(loadLocalColumns())
            .then(() => {
              // columns should match ours, with the
              // custom property and everything
              expect(store.getActions()).toContain({
                type: LOAD_SAVED_COLUMNS,
                columns: expectedColumns,
              });

              // done testing
              done();
            })
        );
    });
  });
});
