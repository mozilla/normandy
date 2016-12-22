import {
  LOAD_SAVED_COLUMNS,
  UPDATE_COLUMN,
  saveLocalColumns as saveState,
} from 'control/actions/ColumnActions';

import compare from 'client/utils/deep-compare';
import cloneArrayValues from 'client/utils/clone-array';

const initialState = [{
  label: 'Name',
  slug: 'name',
  enabled: true,
}, {
  label: 'Action',
  slug: 'action',
  enabled: true,
}, {
  label: 'Enabled',
  slug: 'enabled',
  enabled: true,
}, {
  label: 'Channels',
  slug: 'channels',
}, {
  label: 'Locales',
  slug: 'locales',
}, {
  label: 'Countries',
  slug: 'countries',
}, {
  label: 'Start Time',
  slug: 'startTime',
}, {
  label: 'End Time',
  slug: 'endTime',
}, {
  label: 'Additional Filters',
  slug: 'additionalFilter',
}, {
  label: 'Last Updated',
  slug: 'last_updated',
  enabled: true,
}, {
  label: 'Metadata',
  slug: 'metadata',
  enabled: true,
}];

function columnReducer(state = initialState, action) {
  let newState;
  let slugsMatch;

  const {
    slug,
    isActive,
  } = action;

  switch (action.type) {
    case UPDATE_COLUMN:
      newState = cloneArrayValues(state);
      // find the updated column and set
      // its 'enabled' property
      newState = newState.map(col => {
        if (col.slug === slug) {
          col.enabled = isActive;
        }
        return col;
      });

      // save column config locally
      saveState(newState);
      return newState;

    case LOAD_SAVED_COLUMNS:
      // double check that the incoming columns
      // have the all the same values as our
      // initialState. this prevents a user loading
      // outdated columns from localStorage
      slugsMatch = compare(
        state.map(option => option.slug + option.label),
        action.columns.map(option => option.slug + option.label)
      );

      if (slugsMatch) {
        newState = cloneArrayValues(action.columns);
      }
      return newState || state;

    default:
      return state;
  }
}

export default columnReducer;
