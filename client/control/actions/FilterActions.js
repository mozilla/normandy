import {
  makeApiRequest,
  recipesNeedFetch,
  recipesReceived,
} from 'control/actions/ControlActions';

import {
  getFilterParamString,
} from 'control/selectors/FiltersSelector';

const LOAD_FILTERS = 'LOAD_FILTERS';
const SET_FILTER = 'SET_FILTER';
const SET_TEXT_FILTER = 'SET_TEXT_FILTER';
const SET_ALL_FILTERS = 'SET_ALL_FILTERS';

function loadFilters() {
  return dispatch => {
    dispatch({
      type: LOAD_FILTERS,
      filters: {
        status: [
          {
            key: 'enabled',
            value: 'Enabled',
          },
          'disabled',
        ],
        channel: [
          'release',
          'beta',
          'aurora',
          'nightly',
        ],
        locale: [
          'de',
          'en-CA',
          'en-US',
          'ru',
        ],
        country: [
          'CA',
          'RU',
          'US',
        ],
      },
    });
  };
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
      type: group === 'text' ? SET_TEXT_FILTER : SET_FILTER,
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

    dispatch(makeApiRequest('fetchFilteredRecipes', filterParams))
      .then(recipes => dispatch(recipesReceived(recipes, filterParams)));
  };
}

/**
 * Dispatches a SET_ALL_FILTERS event.
 * If called without a state param,
 * the filters reducer will reset the state
 * to its initialState.
 *
 * @param {Array} state Filter state to set (optional)
 */
function setAllFilters(state) {
  return dispatch => {
    dispatch({
      type: SET_ALL_FILTERS,
      state,
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
const resetFilters = () => setAllFilters();


// Exports
export {
  // action constants
  SET_FILTER,
  SET_ALL_FILTERS,
  SET_TEXT_FILTER,
  LOAD_FILTERS,
  // actions
  loadFilters,
  selectFilter,
  setAllFilters,
  resetFilters,
  loadFilteredRecipes,
};
