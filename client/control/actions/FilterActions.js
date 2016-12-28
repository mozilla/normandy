import makeApiRequest from 'control/api';

import {
  recipesReceived,
  recipesNeedFetch,
} from 'control/actions/RecipeActions';

import {
  getFilterParamString,
} from 'control/selectors/FiltersSelector';

export const LOAD_FILTERS = 'LOAD_FILTERS';
export const SET_FILTER = 'SET_FILTER';
export const SET_TEXT_FILTER = 'SET_TEXT_FILTER';
export const SET_ALL_FILTERS = 'SET_ALL_FILTERS';


/**
 *
 * @param  {[type]} filters [description]
 */
export function filtersReceived(filters) {
  return {
    type: LOAD_FILTERS,
    filters,
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
      .then(recipes => dispatch(filtersReceived(recipes)));
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
  return dispatch => {
    dispatch({
      type: group.value === 'text' ? SET_TEXT_FILTER : SET_FILTER,
      group,
      option,
      isEnabled,
    });
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
 * Dispatches a SET_ALL_FILTERS event.
 * If called without a state param,
 * the filters reducer will reset the state
 * to its initialState.
 *
 * The difference between SET_ALL_FILTERS and LOAD_FILTERS
 * is that LOAD_ parses data from the backend before
 * inserting into the store. SET_ALL assumes that
 * the filters are already parsed, and the _app_ is
 * manipulating the existing store.
 *
 * This is pretty much only used for FilterActions#resetFilters
 *
 * @param {Array} filters Filter state to set (optional)
 */
export function setAllFilters(filters) {
  return dispatch => {
    dispatch({
      type: SET_ALL_FILTERS,
      filters,
    });
  };
}

/**
 * Resetting filters is basically just calling
 * FilterActions#setAllFilters with an empty state. This is just
 * a nicer function to call from components.
 *
 * @return {Function} Result of FilterActions#setAllFilters
 */
export function resetFilters() {
  return setAllFilters();
}
