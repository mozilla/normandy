import {
  makeApiRequest,
  recipesNeedFetch,
  recipesReceived,
  filtersReceived,
} from 'control/actions/ControlActions';

import {
  getFilterParamString,
} from 'control/selectors/FiltersSelector';

const LOAD_FILTERS = 'LOAD_FILTERS';
const SET_FILTER = 'SET_FILTER';
const SET_TEXT_FILTER = 'SET_TEXT_FILTER';
const SET_ALL_FILTERS = 'SET_ALL_FILTERS';


/**
 * Load list of possible filters from remote API.
 * This is stored in the `filters` reducer, and
 * later used to populate relevant RecipeFilters components.
 */
function loadFilters() {
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
function selectFilter({ group, option, isEnabled }) {
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
function loadFilteredRecipes() {
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
function setAllFilters(filters) {
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
function resetFilters() {
  return setAllFilters();
}

// Exports
export {
  // action constants
  SET_FILTER,
  SET_ALL_FILTERS,
  SET_TEXT_FILTER,
  LOAD_FILTERS,
  // action functions
  loadFilters,
  selectFilter,
  setAllFilters,
  resetFilters,
  loadFilteredRecipes,
};
