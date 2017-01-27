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
  RESET_FILTERS,
  SET_TEXT_FILTER,
} from 'control/actions/FilterActions';

import cloneArrayValues from 'client/utils/clone-array';

/**
 * Utility to remove `selected` props from
 * filter groups and their options.
 *
 * @param  {Array} filters  Array of filter groups + options
 * @return {Array}          Array with de`select`ed groups + options
 */
const deleteSelects = filters =>
  cloneArrayValues(filters || [])
    .map(filter => {
      delete filter.selected;
      (filter.options || []).forEach(option => {
        delete option.selected;
      });
      return filter;
    });

// Filters start out empty, as we need to load them from the API
const initialState = {
  list: [],
  active: [],
};

function filtersReducer(state = initialState, action) {
  let newState;
  let textOptions;

  switch (action.type) {
    case LOAD_FILTERS: {
      newState = { ...state };
      newState.list = deleteSelects(action.filters);
      newState.active = deleteSelects(action.filters);
      break;
    }

    case RESET_FILTERS: {
      newState = { ...state };
      newState.active = deleteSelects(newState.list);
      break;
    }

    // User has de/activated a filter
    case SET_FILTER: {
      newState = { ...state };
      // for each group,
      newState.active = [].concat(newState.active).map(group => {
        const newGroup = { ...group };

        // determine if this is the action's filter
        if (newGroup.value === action.group.value) {
          // var to determine if this group has ANY selected options
          let hasSelected = false;

          // loop through each option..
          newGroup.options = cloneArrayValues(newGroup.options).map(option => {
            const newOption = { ...option };

            // ..find the option that this action is targeting..
            if (newOption.value === action.option.value) {
              const selectStatus = action.isEnabled || false;

              if (selectStatus) {
                // ..and then de/select it based on the action
                newOption.selected = selectStatus;
              } else if (newOption.selected) {
                delete newOption.selected;
              }
            }

            // hasSelected will be true if any option is selected
            hasSelected = hasSelected || newOption.selected;
            return newOption;
          });

          // finally, we check if any options are selected,
          // and update the main group accordingly
          if (!hasSelected) {
            // remove the 'selected' prop all together if it exists
            delete newGroup.selected;
          } else if (hasSelected) {
            newGroup.selected = hasSelected;
          }
        }

        return newGroup;
      });
      break;
    }

    case SET_TEXT_FILTER: {
      newState = { ...state };
      newState.active = cloneArrayValues(state.active);

      // function which modifies an existing text group
      // or creates an entirely new one, and appends the
      // text search to the group options
      const formatGroup = group => {
        const newGroup = { ...group };

        // get existing options
        textOptions = cloneArrayValues(newGroup.options || []);

        textOptions = [];

        if (action.isEnabled) {
          // we only allow for one text filter at a time,
          // so just set the whole 'text' options array to just this one
          textOptions = [{
            value: action.option.value || action.option,
            selected: true,
          }];
        }

        // various display options
        newGroup.value = 'text';
        newGroup.label = 'Text Search';
        newGroup.options = textOptions;
        newGroup.selected = action.isEnabled || false;

        return newGroup;
      };

      // track if we've found an existing text group
      let wasFound = false;

      // look through existing groups
      newState.active = newState.active.map(group => {
        // if a text group is found
        if (group.value === 'text') {
          wasFound = true;

          // update it
          return formatGroup(group);
        }

        return group;
      });

      // if we do NOT have an existing text group,
      // create one
      if (!wasFound) {
        newState.active.push(formatGroup());
      }

      break;
    }

    default: {
      break;
    }
  }

  return newState || state;
}

export default filtersReducer;
