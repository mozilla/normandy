import appReducer from 'control/reducers';
import * as actions from 'control/actions/FilterActions';

import {
  initialState,
  stubbedFilters,
} from 'control/tests/fixtures';

/**
 * Filter reducer tests
 */
describe('Filter reducer', () => {
  afterEach(() => {
    // reset the filters stored in memory all together
    // (this wipes both the active AND list props)
    appReducer(undefined, {
      type: actions.LOAD_FILTERS,
      filters: [],
    });
  });

  it('should return initial state by default', () => {
    expect(appReducer(undefined, {})).toEqual({ ...initialState });
  });

  it('should handle LOAD_FILTERS', () => {
    expect(appReducer(undefined, {
      type: actions.LOAD_FILTERS,
      filters: stubbedFilters,
    })).toEqual({
      ...initialState,
      filters: {
        list: stubbedFilters,
        active: stubbedFilters,
      },
    });
  });

  describe('handling RESET_FILTERS', () => {
    it('should reset the `active` array to the `list` array', () => {
      let testState = appReducer(undefined, {});

      // use LOAD_FILTERS to set the in-store initialState
      testState = appReducer(testState, {
        type: actions.LOAD_FILTERS,
        filters: stubbedFilters,
      });

      // save the loaded, pre-manipulated state
      const testInitialState = { ...testState };

      // set some filters (to reset later)
      testState = appReducer(testState, {
        type: actions.SET_FILTER,
        group: {
          value: 'status',
        },
        option: {
          label: 'Enabled',
          value: 'enabled',
        },
        isEnabled: true,
      });

      // the actual test - pass empty SET_ALL,
      // which should reset to the prepped init state
      expect(appReducer(testState, {
        type: actions.RESET_FILTERS,
      })).toEqual(testInitialState);
    });
  });

  describe('handling SET_FILTER', () => {
    it('should enable options', () => {
      const testState = appReducer(undefined, {
        type: actions.LOAD_FILTERS,
        filters: stubbedFilters,
      });

      expect(appReducer(testState, {
        type: actions.SET_FILTER,
        // group of options this affects
        group: {
          value: 'status',
        },
        // the option that is being affected
        option: {
          label: 'Enabled',
          value: 'enabled',
        },
        // the new 'selected' state for this option
        isEnabled: true,
      })).toEqual({
        ...initialState,
        filters: {
          active: [{
            value: 'status',
            label: 'Status',
            multiple: false,
            selected: true,
            options: [{
              label: 'Enabled',
              value: 'enabled',
              selected: true,
            }, {
              label: 'Disabled',
              value: 'disabled',
            }],
          }],
          list: stubbedFilters,
        },
      });
    });

    it('should disable options', () => {
      const testState = appReducer(undefined, {
        type: actions.LOAD_FILTERS,
        filters: stubbedFilters,
      });

      expect(appReducer(testState, {
        type: actions.SET_FILTER,
        // group of options this affects
        group: {
          value: 'status',
        },
        // the option that is being affected
        option: {
          label: 'Enabled',
          value: 'enabled',
        },
        // the new 'selected' state for this option
        isEnabled: false,
      })).toEqual({
        ...initialState,
        filters: {
          active: stubbedFilters,
          list: stubbedFilters,
        },
      });
    });
  });

  it('should handle SET_TEXT_FILTER', () => {
    const testState = appReducer(undefined, {
      type: actions.LOAD_FILTERS,
      filters: stubbedFilters,
    });

    expect(appReducer({ ...testState }, {
      type: actions.SET_TEXT_FILTER,
      group: 'text',
      option: 'this is the text search',
      isEnabled: true,
    })).toEqual({
      ...initialState,
      filters: {
        active: [...stubbedFilters, {
          value: 'text',
          label: 'Text Search',
          selected: true,
          options: [{
            value: 'this is the text search',
            selected: true,
          }],
        }],
        list: stubbedFilters,
      },
    });
  });
});
