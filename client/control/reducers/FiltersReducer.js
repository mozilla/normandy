import {
  ADD_FILTER,
} from 'control/actions/FilterActions';

const initialState = {
  selected: [],

  // list of available simple filters
  available: [{
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
  }],
};

function filtersReducer(state = initialState, action) {
  let newSelected;

  switch (action.type) {
    case ADD_FILTER:
      newSelected = [].concat(state.selected);

      // add to selected
      newSelected.push({
        ...action.group,
        ...action.option,
      });

      // remove from available
      // const newAvailable = [].concat(state.available);
      // newAvailable = newAvailable.filter((availableGroup)=>{
      //   return availableGroup
      // });

      return {
        ...state,
        selected: newSelected,
      };

    default:
      return state;
  }
}

export default filtersReducer;
