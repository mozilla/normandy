import {
  SET_FILTER,
} from 'control/actions/FilterActions';

const initialState = {
  selected: [],

  // list of available simple filters
  available: [{
    label: 'Status',
    value: 'status',
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
  }],
};

function filtersReducer(state = initialState, action) {
  switch (action.type) {
    case SET_FILTER:
      return {
        ...state,
        selected: action.selected,
      };

    default:
      return state;
  }
}

export default filtersReducer;
