import {
  SET_COLUMNS,
  UPDATE_COLUMN,
  saveLocalColumns as saveState,
} from 'control/actions/ColumnActions';

import {
  compare,
} from 'client/utils/hash';

// this could be sexier
const initialState = [{
  label: 'Name',
  value: 'name',
  enabled: true,
}, {
  label: 'Action Name',
  value: 'action',
  enabled: true,
}, {
  label: 'Enabled',
  value: 'enabled',
  enabled: true,
}, {
  label: 'Channels',
  value: 'channels',
}, {
  label: 'Locales',
  value: 'locales',
}, {
  label: 'Countries',
  value: 'countries',
}, {
  label: 'Start Time',
  value: 'startTime',
}, {
  label: 'End Time',
  value: 'endTime',
}, {
  label: 'Additional Filters',
  value: 'additionalFilter',
}, {
  label: 'Last Updated',
  value: 'last_updated',
  enabled: true,
}, {
  label: 'Metadata',
  value: 'metadata',
  enabled: true,
}];

function columnReducer(state = initialState, action) {
  let newState;

  switch (action.type) {
    case UPDATE_COLUMN: {
      const {
        index,
        isActive,
      } = action;

      newState = [].concat(state || []);
      newState[index].enabled = isActive;

      saveState(newState);
      return newState;
    }

    case SET_COLUMNS: {
      // double check that the incoming columns
      // have the all the same values as our
      // initialState. this prevents a user loading
      // outdated columns from localStorage
      const valuesMatch = compare(
        initialState.map(option => option.value + option.label),
        action.columns.map(option => option.value + option.label)
      );

      if (valuesMatch) {
        newState = action.columns;
      }
      return newState;
    }

    default: {
      return state;
    }
  }
}

export default columnReducer;
