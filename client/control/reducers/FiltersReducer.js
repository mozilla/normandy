/**
 * Store for tracking front-end 'filter list' status
 *
 * Exists as an array of objects denoting option groups,
 * containing each set of options per group.
 *
 * Active/enabled filters have a `selected` property,
 * which is mostly used later in the filter selectors
 */

import {
  SET_FILTER,
  SET_ALL_FILTERS,
  ADD_TEXT_FILTER,
  REMOVE_TEXT_FILTER,
} from 'control/actions/FilterActions';

import * as localForage from 'localforage';

/**
 * Utility function to save the state via localForage.
 *
 * @param  {Array}  state Filter state
 * @return {void}
 */
const saveState = state => localForage.setItem('last-filters', state);


// #TODO: this shouldn't be hardcoded - we need to
// create an action and pull this list from the API
const initialState = [
  {
    label: 'Status',
    value: 'enabled',
    multiple: false,
    options: [{
      label: 'Enabled',
      value: true,
    }, {
      label: 'Disabled',
      value: false,
    }],
  }, {
    label: 'Action Name',
    value: 'action',
    multiple: false,
    options: [{
      value: 'console-log',
    }, {
      value: 'show-heartbeat',
    }],
  }, {
    label: 'Channels',
    value: 'channels',
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
    label: 'Locales',
    value: 'locales',
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
  }, {
    label: 'Text Search',
    value: 'text',
    options: [],
    multiple: true,
  },
];

function filtersReducer(state = initialState, action) {
  let newState;
  let textOptions;

  switch (action.type) {

    // App has found the user's previous filter settings,
    // and has dispatched an action to update the store
    // with prior settings
    case SET_ALL_FILTERS:
      newState = [].concat(action.state || initialState);
      saveState(newState);
      return newState;

    // User has de/activated a filter
    case SET_FILTER:
      newState = [].concat(state);

      // for each group,
      newState = newState.map(group => {
        const newGroup = { ...group };

        // determine if this is the action's filter
        if (newGroup.value === action.group.value) {
          // var to determine if this group has ANY selected options
          let hasSelected = false;

          // loop through each option..
          newGroup.options = [].concat(newGroup.options || []).map(option => {
            // ..find the option that this action is targeting..
            if (option.value === action.option.value) {
              // ..and then de/select it based on the action
              option.selected = action.isEnabled || false;
            }

            // hasSelected will be true if any option is selected
            hasSelected = hasSelected || option.selected;
            return option;
          });

          // finally, we check if any options are selected,
          // and update the main group accordingly
          newGroup.selected = hasSelected;
        }

        return newGroup;
      });

      // save the new filterstate locally
      saveState(newState);
      return newState;


    case ADD_TEXT_FILTER:
      newState = [].concat(state || []);

      newState = newState.map(group => {
        if (group.value === 'text') {
          const newGroup = { ...group };

          textOptions = [].concat(newGroup.options);
          textOptions.push({
            value: action.filter,
            selected: true,
          });

          newGroup.options = textOptions;
          newGroup.selected = true;

          return newGroup;
        }

        return group;
      });

      saveState(newState);
      return newState;

    case REMOVE_TEXT_FILTER:
      newState = [].concat(state || []);

      newState = newState.map(group => {
        console.log('here?', group);
        if (group.value === 'text') {
          const newGroup = { ...group };

          textOptions = [].concat(newGroup.options);
          textOptions = textOptions.filter(option => option.value !== action.filter);

          console.log('here', textOptions, newGroup.options);
          newGroup.options = textOptions;
          return newGroup;
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
