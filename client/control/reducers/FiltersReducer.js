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
  LOAD_FILTERS,
  SET_FILTER,
  SET_ALL_FILTERS,
  ADD_TEXT_FILTER,
  REMOVE_TEXT_FILTER,
} from 'control/actions/FilterActions';

import cloneArrayValues from 'client/utils/clone-array-values';

function formatLabel(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatFilterOption(option) {
  let label;
  let value;

  // string type = we were given just an option
  // (no keyed value/label)
  if (typeof option === 'string') {
    value = option;
    label = formatLabel(option);
  // else if we get an object, then we
  // can extract the key/value props
  } else if (typeof option === 'object') {
    label = option.value;
    value = option.key;
  }

  return {
    value,
    label,
  };
}

let initialState = [];

function filtersReducer(state = initialState, action) {
  let newState;
  let textOptions;

  switch (action.type) {
    case LOAD_FILTERS: {
      newState = [];
      const { filters } = action;

      for (const group in filters) {
        if (!filters.hasOwnProperty(group)) {
          break;
        }
        const newGroup = {
          value: group,
          label: formatLabel(group),
          multiple: filters[group].length > 2,
          options: cloneArrayValues(filters[group]).map(formatFilterOption),
        };

        newState.push(newGroup);
      }

      initialState = JSON.parse(JSON.stringify(newState));

      break;
    }

    // App has found the user's previous filter settings,
    // and has dispatched an action to update the store
    // with prior settings
    case SET_ALL_FILTERS: {
      const valuesMatch =
        JSON.stringify(initialState.map(option => option.value + option.label)) ===
        JSON.stringify((action.filters || []).map(option => option.value + option.label));

      if (valuesMatch) {
        newState = action.filters;
      } else {
        newState = cloneArrayValues(initialState);
      }

      break;
    }

    // User has de/activated a filter
    case SET_FILTER: {
      newState = cloneArrayValues(state);

      // for each group,
      newState = newState.map(group => {
        const newGroup = { ...group };

        // determine if this is the action's filter
        if (newGroup.value === action.group.value) {
          // var to determine if this group has ANY selected options
          let hasSelected = false;

          // loop through each option..
          newGroup.options = cloneArrayValues(newGroup.options || []).map(option => {
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

      break;
    }

    case ADD_TEXT_FILTER: {
      newState = cloneArrayValues(state || []);

      newState = newState.map(group => {
        if (group.value === 'text') {
          const newGroup = { ...group };

          textOptions = cloneArrayValues(newGroup.options);
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
      break;
    }

    case REMOVE_TEXT_FILTER: {
      newState = cloneArrayValues(state || []);

      newState = newState.map(group => {
        if (group.value === 'text') {
          const newGroup = { ...group };

          textOptions = cloneArrayValues(newGroup.options);
          textOptions = textOptions.filter(option => option.value !== action.filter);

          newGroup.options = textOptions;
          return newGroup;
        }

        return group;
      });

      break;
    }

    default: {
      break;
    }
  }

  return newState || state;
}

export default filtersReducer;
