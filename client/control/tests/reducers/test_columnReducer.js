import appReducer from 'control/reducers';
import * as actions from 'control/actions/ColumnActions';

import {
  initialState,
} from 'control/tests/fixtures';

/**
 * Utility function to clone the initialState column array and its values
 * (This prevents nested objects from being cloned by reference)
 *
 * @return {Array} New array with cloned initialState values
 */
const cloneInitialArray = () => JSON.parse(JSON.stringify(initialState.columns));


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

  if (!foundIndex) {
    console.warn('Warning! No non-default columns to test against.');
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

  it('should have default columns to display', () => {
    const defaults = [
      'name',
      'action',
      'enabled',
      'last_updated',
      'metadata',
    ];

    // get the columns that are enabled,
    // and their shorthand values
    const foundDefaults = cloneInitialArray()
      .filter(col => col.enabled)
      .map(col => col.value);

    // arrays of default enableds should match
    expect(foundDefaults).toEqual(defaults);
  });

  it('should handle UPDATE_COLUMN (enable)', () => {
    const expectedColumns = cloneInitialArray();

    // grab a non-default'd column
    const colId = getNondefaultColumn();
    expectedColumns[colId].enabled = true;

    expect(appReducer(undefined, {
      type: actions.UPDATE_COLUMN,
      index: colId,
      isActive: true,
    })).toEqual({
      ...initialState,
      columns: expectedColumns,
    });
  });

  it('should handle UPDATE_COLUMN (disable)', () => {
    const expectedColumns = cloneInitialArray();
    expectedColumns[0].enabled = false;

    expect(appReducer(undefined, {
      type: actions.UPDATE_COLUMN,
      index: 0,
      isActive: false,
    })).toEqual({
      ...initialState,
      columns: expectedColumns,
    });
  });

  describe('handling LOAD_SAVED_COLUMNS', () => {
    // when loading, the values/labels are compared against what's
    // inside initial state - this prevents the user loading outdated columns
    it('should ignore an action with unrecognized columns', () => {
      const newColumns = [{
        label: 'This column doesnt exist',
        value: 'so it should fail',
      }];

      // expect the columns to remain the default
      expect(appReducer(undefined, {
        type: actions.LOAD_SAVED_COLUMNS,
        columns: newColumns,
      })).toEqual(initialState);
    });

    it('should set the column state if column labels/values match', () => {
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
