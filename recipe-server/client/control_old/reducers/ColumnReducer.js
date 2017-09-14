import { isEqual } from 'underscore';

import {
  LOAD_SAVED_COLUMNS,
  UPDATE_COLUMN,
  saveLocalColumns as saveState,
} from 'control_old/actions/ColumnActions';

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
      newState = [].concat(state);
      // find the updated column and set
      // its 'enabled' property
      newState = newState.map(col => {
        const newCol = { ...col };
        if (newCol.slug === slug) {
          if (isActive) {
            newCol.enabled = true;
          } else {
            delete newCol.enabled;
          }
        }
        return newCol;
      });

      // save column config locally
      saveState(newState);
      return newState;

    case LOAD_SAVED_COLUMNS:
      // double check that the incoming columns
      // have the all the same values as our
      // initialState. this prevents a user loading
      // outdated columns from localStorage
      slugsMatch = isEqual(
        state.map(option => option.slug + option.label),
        action.columns.map(option => option.slug + option.label),
      );

      if (slugsMatch) {
        newState = [].concat(action.columns);
      }
      return newState || state;

    default:
      return state;
  }
}

export default columnReducer;
