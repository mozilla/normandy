import titleize from 'underscore.string/titleize';

import makeApiRequest from 'control/api';

import {
  recipesNeedFetch,
  recipesReceived,
} from 'control/actions/RecipeActions';

import {
  getFilterParamString,
} from 'control/selectors/FiltersSelector';


export const SET_FILTER = 'SET_FILTER';
export const SET_TEXT_FILTER = 'SET_TEXT_FILTER';
export const LOAD_FILTERS = 'LOAD_FILTERS';
export const RESET_FILTERS = 'RESET_FILTERS';


function formatFilterOption(option) {
  let label;
  let value;

  // string type = we were given just an option
  // (no keyed value/label)
  if (typeof option === 'string') {
    label = option;
    value = option;
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
export function loadFilters() {
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
            label: titleize(group),
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
export function selectFilter({ group, option, isEnabled }) {
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
export function loadFilteredRecipes() {
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
export function resetFilters() {
  return {
    type: RESET_FILTERS,
  };
}

export function filtersReceived(filters) {
  return {
    type: LOAD_FILTERS,
    filters,
  };
}
