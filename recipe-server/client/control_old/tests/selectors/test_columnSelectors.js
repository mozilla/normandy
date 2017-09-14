import { initialState } from 'control_old/tests/fixtures';
import * as columnSelectors from 'control_old/selectors/ColumnSelector';

describe('Column Selectors', () => {
  describe('getActiveColumns', () => {
    it('returns only columns that are enabled', () => {
      const enabled = ['name', 'action', 'channels', 'endTime'];

      // enable the selected columns
      const testColumns = [].concat(initialState.columns)
        .map(col => {
          col.enabled = enabled.indexOf(col.slug) > -1;
          return col;
        });

      // compare the slugs that are returned
      const active = columnSelectors
        .getActiveColumns(testColumns)
        .map(col => col.slug);

      expect(active).toEqual(enabled);
    });
  });

  describe('getInactiveColumns', () => {
    it('returns only columns that are NOT enabled', () => {
      const disabled = ['name', 'action', 'channels', 'endTime'];

      // disable the chosen columns
      const testColumns = [].concat(initialState.columns)
        .map(col => {
          col.enabled = disabled.indexOf(col.slug) === -1;
          return col;
        });

      // compare the values that are returned
      const inactive = columnSelectors
        .getInactiveColumns(testColumns)
        .map(col => col.slug);

      expect(inactive).toEqual(disabled);
    });
  });
});
