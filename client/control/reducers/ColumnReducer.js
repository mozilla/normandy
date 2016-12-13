import {
  LOAD_SAVED_COLUMNS,
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
  label: 'Action',
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

/**
 * Given an array, clones items _by value_
 * and returns a new array instance.
 *
 * @param  {Array}  arr Array of values to clone
 * @return {Array}      New array of new values
 */
const cloneArrayValues = arr => JSON.parse(JSON.stringify(arr));

function columnReducer(state = initialState, action) {
  let newState;
  let valuesMatch;

  const {
    index,
    isActive,
  } = action;

  switch (action.type) {
    case UPDATE_COLUMN:
      newState = cloneArrayValues(state || []);
      newState[index].enabled = isActive;

      saveState(newState);
      return newState;

    case LOAD_SAVED_COLUMNS:
      // double check that the incoming columns
      // have the all the same values as our
      // initialState. this prevents a user loading
      // outdated columns from localStorage
      valuesMatch = compare(
        state.map(option => option.value + option.label),
        action.columns.map(option => option.value + option.label)
      );

      if (valuesMatch) {
        newState = cloneArrayValues(action.columns);
      }
      return newState || state;

    default:
      return state;
  }
}

export default columnReducer;
