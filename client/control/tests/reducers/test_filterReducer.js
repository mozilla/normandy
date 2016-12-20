import appReducer from 'control/reducers';
import * as actions from 'control/actions/FilterActions';

import {
  initialState,
} from 'control/tests/fixtures';

/**
 * Column reducer tests
 */
describe('Filter reducer', () => {
  it('should return initial state by default', () => {
    expect(appReducer(undefined, {})).toEqual({ ...initialState });
  });

  it('should handle LOAD_FILTERS', () => {
    expect(appReducer(undefined, {
      type: actions.LOAD_FILTERS,
      filters: {
        status: [
          // string values should convert to objs
          'enabled',
          // objects should apply key/value appropriately
          {
            key: 'disabled',
            value: 'Disable option',
          },
        ],
      },
    })).toEqual({
      ...initialState,
      filters: [{
        value: 'status',
        label: 'Status',
        multiple: false,
        options: [{
          label: 'Enabled',
          value: 'enabled',
        }, {
          label: 'Disable option',
          value: 'disabled',
        }],
      }],
    });
  });

  describe('handling SET_ALL_FILTERS', () => {
    it('should set the store to the passed filters', () => {
      expect(appReducer(undefined, {
        type: actions.SET_ALL_FILTERS,
        filters: [{
          value: 'status',
          label: 'Status',
          multiple: false,
          options: [{
            label: 'Enabled',
            value: 'enabled',
            // use 'selected' prop for testing
            selected: true,
          }, {
            label: 'Disable option',
            value: 'disabled',
            // use 'selected' prop for testing
            selected: false,
          }],
        }],
      })).toEqual({
        ...initialState,
        filters: [{
          value: 'status',
          label: 'Status',
          multiple: false,
          options: [{
            label: 'Enabled',
            value: 'enabled',
            selected: true,
          }, {
            label: 'Disable option',
            value: 'disabled',
            selected: false,
          }],
        }],
      });
    });

    it('should reset to initialState if no params are passed', () => {
      let testState = appReducer(undefined, {});

      // use LOAD_FILTERS to set the in-store initialState
      testState = appReducer({ ...testState }, {
        type: actions.LOAD_FILTERS,
        filters: {
          status: [
            'enabled',
            'disabled',
          ],
        },
      });

      // hold onto the 'new' initialState
      const testInitialState = { ...testState };

      // use SET_ALL to alter the in-store memory
      testState = appReducer({ ...testState }, {
        type: actions.SET_ALL_FILTERS,
        filters: [{
          value: 'status',
          label: 'Status',
          multiple: false,
          options: [{
            label: 'Enabled',
            value: 'enabled',
            // use 'selected' prop for testing
            selected: true,
          }, {
            label: 'Disabled',
            value: 'disabled',
            // use 'selected' prop for testing
            selected: false,
          }],
        }],
      });

      // the actual test - pass empty SET_ALL,
      // which should reset to the prepped init state
      expect(appReducer({ ...testState }, {
        type: actions.SET_ALL_FILTERS,
      })).toEqual({
        ...testInitialState,
      });
    });
  });

  describe('handling SET_FILTER', () => {
    // init the filters

    it('should enable options appropriately', () => {
      const testState = appReducer(undefined, {
        type: actions.LOAD_FILTERS,
        filters: {
          status: [
            'enabled',
            'disabled',
          ],
        },
      });

      expect(appReducer({ ...testState }, {
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
        filters: [{
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
      });
    });

    it('should disable options appropriately', () => {
      // set up some pre-existing filters that are already selected
      const testState = appReducer(undefined, {
        type: actions.SET_ALL_FILTERS,
        filters: [{
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
      });

      expect(appReducer({ ...testState }, {
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
        filters: [{
          value: 'status',
          label: 'Status',
          multiple: false,
          options: [{
            label: 'Enabled',
            value: 'enabled',
          }, {
            label: 'Disabled',
            value: 'disabled',
          }],
        }],
      });
    });
  });

  it('should handle SET_TEXT_FILTER', () => {
    const testState = appReducer(undefined, {
      type: actions.LOAD_FILTERS,
      filters: {
        status: [
          'enabled',
          'disabled',
        ],
      },
    });

    expect(appReducer({ ...testState }, {
      type: actions.SET_TEXT_FILTER,
      group: 'text',
      option: 'this is the text search',
      isEnabled: true,
    })).toEqual({
      ...initialState,
      filters: [{
        value: 'status',
        label: 'Status',
        multiple: false,
        options: [{
          label: 'Enabled',
          value: 'enabled',
        }, {
          label: 'Disabled',
          value: 'disabled',
        }],
      }, {
        value: 'text',
        label: 'Text Search',
        selected: true,
        options: [{
          value: 'this is the text search',
          selected: true,
        }],
      }],
    });
  });
});
