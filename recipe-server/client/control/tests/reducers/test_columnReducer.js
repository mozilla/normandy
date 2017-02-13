import appReducer from 'control/reducers';
import * as actions from 'control/actions/ColumnActions';

import {
  initialState,
} from 'control/tests/fixtures';

/**
 * Utility function to get the index of a column
 * which is NOT shown by default.
 *
 * @return {Number} Index of non-default column to test against.
 */
const getNondefaultColumnIndex = () => {
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

const getDefaultColumnIndex = () => {
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
      const expectedColumns = [].concat(initialState.columns);

      // grab a non-default'd column
      const colIdx = getNondefaultColumnIndex();
      expectedColumns[colIdx] = {
        ...expectedColumns[colIdx],
        enabled: true,
      };

      const colSlug = expectedColumns[colIdx].slug;

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
      const colIdx = getDefaultColumnIndex();
      const colSlug = initialState.columns[colIdx].slug;

      const expectedColumns = [].concat(initialState.columns);
      // clone the thing we're editing
      expectedColumns[colIdx] = { ...expectedColumns[colIdx] };
      // the `enabled` prop should be gone
      delete expectedColumns[colIdx].enabled;

      // de-activate (the actual test)
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
      const expectedState = [].concat(initialState.columns)
        .map(col => {
          const newCol = { ...col };
          newCol.enabled = true;
          return newCol;
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
