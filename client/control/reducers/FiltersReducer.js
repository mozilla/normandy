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

import hash from 'client/utils/hash';

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
    value: 'status',
    multiple: false,
    options: [
      'Enabled',
      'Disabled',
    ],
  }, {
    value: 'action',
    multiple: false,
    options: [
      'console-log',
      'show-heartbeat',
    ],
  }, {
    value: 'channels',
    multiple: true,
    options: [
      'release',
      'beta',
      'aurora',
      'nightly',
    ],
  }, {
    value: 'locales',
    multiple: true,
    options: [
      'en-US',
      'en-UK',
      'de',
      'ru',
    ],
  }, {
    value: 'text',
    options: [],
    multiple: true,
  },
];

// get a hash of the value strings
const defaultHash = hash(initialState.map(option => option.value));

function filtersReducer(state = initialState, action) {
  let newState;
  let textOptions;

  switch (action.type) {

    // App has found the user's previous filter settings,
    // and has dispatched an action to update the store
    // with prior settings
    case SET_ALL_FILTERS: {
      // no action.state == use initialState
      let foundState = initialState;

      // double check that the loaded filters
      // have the same properties as initState
      // (this prevents weird mismatches when filters
      // are changed/updated in code but old
      // settings are still saved in storage)
      if (action.state) {
        const foundHash = hash(action.state.map(option => option.value));
        // if the loaded hash has the same values
        // as the initial hash, then we can set
        // the filter state as the action state
        if (foundHash === defaultHash) {
          foundState = action.state;
        }
      }

      newState = [].concat(foundState);
      saveState(newState);
      return newState;
    }

    // User has de/activated a filter
    case SET_FILTER: {
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
    }


    case ADD_TEXT_FILTER: {
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
    }

    case REMOVE_TEXT_FILTER: {
      newState = [].concat(state || []);

      newState = newState.map(group => {
        if (group.value === 'text') {
          const newGroup = { ...group };

          textOptions = [].concat(newGroup.options);
          textOptions = textOptions.filter(option => option.value !== action.filter);

          newGroup.options = textOptions;
          return newGroup;
        }

        return group;
      });

      saveState(newState);
      return newState;
    }

    default: {
      return state;
    }
  }
}

export default filtersReducer;
