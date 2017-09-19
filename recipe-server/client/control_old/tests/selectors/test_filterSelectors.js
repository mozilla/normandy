import {
  stubbedFilters,
  multiStubbedFilters,
} from 'control_old/tests/fixtures';
import * as selectors from 'control_old/selectors/FiltersSelector';

/**
 * Utility to deep clone the multi/stubbed filters.
 * Some tests alter objects directly, which requires us
 * to clone the option objects in the nested `options` array.
 *
 * @param  {boolean} multi  Clone `multiStubbedFilters` instead of `stubbedFilters`?
 * @return {Array}          Array of deep-cloned filters
 */
const cloneFilters = multi =>
  [].concat(multi ? multiStubbedFilters : stubbedFilters)
    .map(filter =>
      ({
        ...filter,
        // since we alter some filter options in the tests,
        // we want to make fresh copies of the objects
        options: [...filter.options].map(option => ({ ...option })),
      }),
    );
/**
 * Alias for the multi-version of `cloneFilters`
 * @return {Array}          Array of deep-cloned multi filters
 */
const cloneMultiFilters = () => cloneFilters(true);


describe('Filter Selectors', () => {
  describe('getSelectedFilterGroups', () => {
    it('should only return filter groups that have been selected', () => {
      let state = {
        list: multiStubbedFilters,
        active: multiStubbedFilters,
      };
      expect(selectors.getSelectedFilterGroups(state)).toEqual([]);

      const activeTest = cloneMultiFilters();
      activeTest[0] = {
        ...activeTest[0],
        selected: true,
      };
      activeTest[0].options[0] = {
        ...activeTest[0].options[0],
        selected: true,
      };

      state = {
        list: multiStubbedFilters,
        active: activeTest,
      };
      expect(selectors.getSelectedFilterGroups(state)).toEqual([activeTest[0]]);
    });
  });

  describe('getActiveFilterOptions', () => {
    it('should return only groups + options that are `selected`', () => {
      const activeTest = cloneMultiFilters();
      activeTest[0] = {
        ...activeTest[0],
        selected: true,
      };
      activeTest[0].options[0] = {
        ...activeTest[0].options[0],
        selected: true,
      };

      const state = {
        list: multiStubbedFilters,
        active: activeTest,
      };

      expect(selectors.getActiveFilterOptions(state)).toEqual([{
        ...activeTest[0],
        options: [activeTest[0].options[0]],
      }]);
    });
  });

  describe('getFilterParamString', () => {
    it('should return an empty string if no filters are active', () => {
      const state = {
        list: stubbedFilters,
        active: stubbedFilters,
      };
      expect(selectors.getFilterParamString(state)).toEqual('');
    });

    it('should convert filter values to query params', () => {
      const activeTest = cloneFilters();
      activeTest[0] = {
        ...activeTest[0],
        selected: true,
      };
      activeTest[0].options[0] = {
        ...activeTest[0].options[0],
        selected: true,
      };

      const state = {
        list: stubbedFilters,
        active: activeTest,
      };
      expect(selectors.getFilterParamString(state)).toEqual('status=enabled');
    });

    it('should concat multiple queries with an ampersand', () => {
      const activeTest = cloneMultiFilters();
      activeTest[0] = {
        ...activeTest[0],
        selected: true,
      };
      activeTest[0].options[0] = {
        ...activeTest[0].options[0],
        selected: true,
      };

      activeTest[1] = {
        ...activeTest[1],
        selected: true,
      };
      activeTest[1].options[0] = {
        ...activeTest[1].options[0],
        selected: true,
      };

      const state = {
        list: multiStubbedFilters,
        active: activeTest,
      };
      expect(selectors.getFilterParamString(state)).toEqual('status=enabled&countries=US');
    });

    it('should handle multiple values with commas', () => {
      const activeTest = cloneMultiFilters();
      activeTest[1] = {
        ...activeTest[1],
        selected: true,
      };
      activeTest[1].options[0] = {
        ...activeTest[1].options[0],
        selected: true,
      };
      activeTest[1].options[1] = {
        ...activeTest[1].options[1],
        selected: true,
      };

      const state = {
        list: multiStubbedFilters,
        active: activeTest,
      };
      expect(selectors.getFilterParamString(state)).toEqual('countries=US,CA');
    });

    it('should URI-encode text filters', () => {
      const activeTest = [{
        value: 'text',
        label: 'Text Filter',
        multiple: true,
        selected: true,
        options: [{
          selected: true,
          value: 'test string',
        }],
      }];

      const state = {
        list: [],
        active: activeTest,
      };
      expect(selectors.getFilterParamString(state)).toEqual('text=test%20string');
    });
  });

  describe('getAvailableFilters', () => {
    it('should return groups with non-selected options', () => {
      const state = {
        list: multiStubbedFilters,
        active: multiStubbedFilters,
      };
      // shouldn't have anything since nothing is activated
      expect(selectors.getAvailableFilters(state)).toEqual(multiStubbedFilters);
    });

    it('should exclude non-multiple groups that have selections', () => {
      const activeTest = cloneMultiFilters();
      // multiple should already be false, but for test's sake we'll
      // confirm that it's set here as well
      activeTest[0] = {
        ...activeTest[0],
        multiple: false,
        selected: true,
      };
      activeTest[0].options[0] = {
        ...activeTest[0].options[0],
        selected: true,
      };

      // we expect only the second filter group to appear
      const expectedList = [activeTest[1]];

      const state = {
        list: multiStubbedFilters,
        active: activeTest,
      };

      expect(selectors.getAvailableFilters(state)).toEqual(expectedList);
    });

    it('should not return groups which have no options', () => {
      const optionlessFilters = [{
        value: 'status',
        label: 'Status',
        multiple: false,
        options: [],
      }];

      const state = {
        list: optionlessFilters,
        active: optionlessFilters,
      };

      expect(selectors.getAvailableFilters(state)).toEqual([]);
    });
  });

  describe('isFilteringActive', () => {
    it('should return a bool indicating if any filters are active', () => {
      const activeTest = cloneMultiFilters();
      activeTest[0] = {
        ...activeTest[0],
        selected: true,
      };
      activeTest[0].options[0] = {
        ...activeTest[0].options[0],
        selected: true,
      };

      // test non-active set
      let state = {
        list: multiStubbedFilters,
        active: multiStubbedFilters,
      };
      expect(selectors.isFilteringActive(state)).toEqual(false);

      // test set with active filters
      state = {
        list: multiStubbedFilters,
        active: activeTest,
      };
      expect(selectors.isFilteringActive(state)).toEqual(true);
    });
  });
});
