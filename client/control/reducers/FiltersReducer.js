import {
  ADD_FILTER,
} from 'control/actions/FilterActions';

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
    case ADD_FILTER:
      newState = [].concat(state);

      newState = newState.map(group => {
        if (group.value === action.group.value) {
          group.selected = action.isEnabled || false;

          group.options = group.options.map(option => {
            if (option.value === action.option.value) {
              option.selected = action.isEnabled || false;
            }
            return option;
          });
        }

        return group;
      });

      return newState;

    default:
      return state;
  }
}

export default filtersReducer;
