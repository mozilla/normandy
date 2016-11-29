import {
  SET_FILTER,
  LOAD_LAST_FILTERS,
} from 'control/actions/FilterActions';

import * as localForage from 'localforage';

const saveState = state => localForage.setItem('last-filters', state);

const initialState = [
  {
    label: 'Status',
    value: 'status',
    multiple: false,
    options: [{
      label: 'Enabled',
      value: 'enabled',
    }, {
      label: 'Disabled',
      value: 'disabled',
    }],
  }, {
    label: 'Channel',
    value: 'channel',
    multiple: true,
    options: [{
      label: 'Release',
      value: 'release',
    }, {
      label: 'Beta',
      value: 'beta',
    }, {
      label: 'Aurora / Developer Edition',
      value: 'aurora',
    }, {
      label: 'Nightly',
      value: 'nightly',
    }],
  }, {
    label: 'Locale',
    value: 'locale',
    multiple: true,
    options: [{
      label: 'English (US)',
      value: 'en-US',
    }, {
      label: 'English (UK)',
      value: 'en-UK',
    }, {
      label: 'German',
      value: 'de',
    }, {
      label: 'Russian',
      value: 'ru',
    }],
  },
];

function filtersReducer(state = initialState, action) {
  let newState;

  switch (action.type) {
    case LOAD_LAST_FILTERS:
      newState = [].concat(action.state || initialState);
      saveState(newState);
      return newState;

    case SET_FILTER:
      newState = [].concat(state);

      newState = newState.map(group => {
        // get the group the action is for
        if (group.value === action.group.value) {
          let hasSelected = false;

          group.options = [].concat(group.options || []).map(option => {
            if (option.value === action.option.value) {
              option.selected = action.isEnabled || false;
            }

            hasSelected = hasSelected || option.selected;
            return option;
          });

          group.selected = hasSelected;
        }

        return group;
      });

      saveState(newState);

      return newState;

    default:
      return state;
  }
}

export default filtersReducer;
