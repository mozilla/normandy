import appReducer from 'control/reducers';
import * as actions from 'control/actions/ColumnActions';

import {
  initialState,
} from 'control/tests/fixtures';

import cloneArrayValues from 'client/utils/clone-array';

/**
 * Utility function to clone the initialState column array and its values
 * (This prevents nested objects from being cloned by reference)
 *
 * @return {Array} New array with cloned initialState values
 */
function cloneInitialArray() {
  return cloneArrayValues(initialState.columns);
}


/**
 * Utility function to get the index of a column
 * which is NOT shown by default.
 *
 * @return {Number} Index of non-default column to test against.
 */
const getNondefaultColumn = () => {
  let foundIndex;
  initialState.columns
    .find((col, index) => {
      foundIndex = index;
      return !col.enabled;
    });

  if (typeof foundIndex === 'undefined') {
    throw new Error('Warning! No non-default columns to test against.');
  }
  return foundIndex;
};

const getDefaultColumn = () => {
  let foundIndex;
  initialState.columns
    .find((col, index) => {
      foundIndex = index;
      return col.enabled;
    });

  if (typeof foundIndex === 'undefined') {
    throw new Error('Warning! No default columns to test against.');
  }
  return foundIndex;
};

/**
 * Column reducer tests
 */
describe('Column reducer', () => {
  it('should return initial state by default', () => {
    expect(appReducer(undefined, {})).toEqual(initialState);
  });

  describe('handling UPDATE_COLUMN', () => {
    it('should enable columns appropriately', () => {
      const expectedColumns = cloneInitialArray();

      // grab a non-default'd column
      const colId = getNondefaultColumn();
      expectedColumns[colId].enabled = true;

      const colSlug = expectedColumns[colId].slug;

      expect(appReducer(undefined, {
        type: actions.UPDATE_COLUMN,
        slug: colSlug,
        isActive: true,
      })).toEqual({
        ...initialState,
        columns: expectedColumns,
      });
    });

    it('should disable columns appropriately', () => {
      const expectedColumns = cloneInitialArray();
      const colId = getDefaultColumn();

      expectedColumns[colId].enabled = false;
      const colSlug = expectedColumns[colId].slug;

      expect(appReducer(undefined, {
        type: actions.UPDATE_COLUMN,
        slug: colSlug,
        isActive: false,
      })).toEqual({
        ...initialState,
        columns: expectedColumns,
      });
    });
  });


  describe('handling LOAD_SAVED_COLUMNS', () => {
    // when loading, the slugs/labels are compared against what's
    // inside initial state - this prevents the user loading outdated columns
    it('should ignore an action with unrecognized columns', () => {
      const newColumns = [{
        label: 'This column doesnt exist',
        slug: 'so it should fail',
      }];

      // expect the columns to remain the default
      expect(appReducer(undefined, {
        type: actions.LOAD_SAVED_COLUMNS,
        columns: newColumns,
      })).toEqual(initialState);
    });

    it('should set the column state if column labels/slugs match', () => {
      // after checking values/labels, the column state should be updated
      // with whatever column set is passed in
      const expectedState = cloneInitialArray()
        .map(col => {
          col.enabled = true;
          return col;
        });

      expect(appReducer(undefined, {
        type: actions.LOAD_SAVED_COLUMNS,
        columns: expectedState,
      })).toEqual({
        ...initialState,
        columns: expectedState,
      });
    });
  });
});
