import { initialState } from 'control/tests/fixtures';
import * as columnSelectors from 'control/selectors/ColumnSelector';

import cloneArrayValues from 'client/utils/clone-array-values';


describe('Column Selectors', () => {
  describe('getActiveColumns', () => {
    it('returns only columns that are enabled', () => {
      const enabled = ['name', 'action', 'channels', 'endTime'];

      // enable the selected columns
      const testColumns = cloneArrayValues(initialState.columns)
        .map(col => {
          col.enabled = enabled.indexOf(col.value) > -1;
          return col;
        });

      // compare the values that are returned
      const active = columnSelectors.getActiveColumns(testColumns).map(col => col.value);
      expect(active).toEqual(enabled);
    });
  });

  describe('getInactiveColumns', () => {
    it('returns only columns that are NOT enabled', () => {
      const disabled = ['name', 'action', 'channels', 'endTime'];

      // disable the chosen columns
      const testColumns = cloneArrayValues(initialState.columns)
        .map(col => {
          col.enabled = disabled.indexOf(col.value) === -1;
          return col;
        });

      // compare the values that are returned
      const inactive = columnSelectors.getInactiveColumns(testColumns).map(col => col.value);
      expect(inactive).toEqual(disabled);
    });
  });
});
