import {
  makeApiRequest,
  recipesNeedFetch,
  recipesReceived,
  filtersReceived,
} from 'control/actions/ControlActions';

import {
  getFilterParamString,
} from 'control/selectors/FiltersSelector';

import { capitalizeFirst } from 'client/utils/string-man';

const SET_FILTER = 'SET_FILTER';
const SET_TEXT_FILTER = 'SET_TEXT_FILTER';
const LOAD_FILTERS = 'LOAD_FILTERS';
const RESET_FILTERS = 'RESET_FILTERS';

function formatFilterOption(option) {
  let label;
  let value;

  // string type = we were given just an option
  // (no keyed value/label)
  if (typeof option === 'string') {
    value = label = option;
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


/**
 * Load list of possible filters from remote API.
 * This is stored in the `filters` reducer, and
 * later used to populate relevant RecipeFilters components.
 */
function loadFilters() {
  return dispatch =>
    dispatch(makeApiRequest('fetchFilters'))
      .then(filters => {
        if (!filters) {
          return;
        }
        const newFilters = [];
        // format each recipe
        for (const group in filters) {
          if (!filters.hasOwnProperty(group)) {
            break;
          }
          const newGroup = {
            value: group,
            label: capitalizeFirst(group),
            multiple: filters[group].length > 2,
            options: [].concat(filters[group]).map(formatFilterOption),
          };

          newFilters.push(newGroup);
        }

        dispatch(filtersReceived(newFilters));
      });
}

/**
 * Given an option and its parent group, update the
 * filter state based on the `isEnabled` prop
 *
 * @param  {Object}  group     Group the filter belongs to
 * @param  {Object}  option    Option that was affected
 * @param  {Boolean} isEnabled Is the option selected?
 */
function selectFilter({ group, option, isEnabled }) {
  return {
    type: group.value === 'text' ? SET_TEXT_FILTER : SET_FILTER,
    group,
    option,
    isEnabled,
  };
}


/**
 * Detects activated filters, creates the URL param string,
 * and queries API for a filtered list based on params.
 */
function loadFilteredRecipes() {
  return (dispatch, getState) => {
    dispatch(recipesNeedFetch());

    const filterParams = getFilterParamString(getState().filters);

    return dispatch(makeApiRequest('fetchFilteredRecipes', filterParams))
      .then(recipes => dispatch(recipesReceived(recipes, filterParams)));
  };
}

/**
 * Dispatches a RESET_FILTERS event, which resets
 * the 'active' filters to what was loaded earlier.
 */
function resetFilters() {
  return {
    type: RESET_FILTERS,
  };
}

// Exports
export {
  // action constants
  SET_FILTER,
  RESET_FILTERS,
  SET_TEXT_FILTER,
  LOAD_FILTERS,
  // action functions
  loadFilters,
  selectFilter,
  resetFilters,
  loadFilteredRecipes,
};
