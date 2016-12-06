import {
  SET_COLUMNS,
  UPDATE_COLUMN,
} from 'control/actions/ColumnActions';

import * as localForage from 'localforage';

/**
 * Utility function to save the state via localForage.
 *
 * @param  {Array}  state Filter state
 * @return {void}
 */
const saveState = state => localForage.setItem('columns', state);

// #TODO: this shouldn't be hardcoded - we need to
// create an action and pull this list from the API
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
      newState = action.columns;
      return newState;
    }

    default: {
      return state;
    }
  }
}

export default columnReducer;
