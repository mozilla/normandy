const SET_FILTER = 'SET_FILTER';
const SET_ALL_FILTERS = 'SET_ALL_FILTERS';
const ADD_TEXT_FILTER = 'ADD_TEXT_FILTER';
const REMOVE_TEXT_FILTER = 'REMOVE_TEXT_FILTER';

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
    if (group.value === 'text') {
      dispatch({
        type: isEnabled ? ADD_TEXT_FILTER : REMOVE_TEXT_FILTER,
        filter: option.value,
      });
    } else {
      dispatch({
        type: SET_FILTER,
        group,
        option,
        isEnabled,
      });
    }
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


function addTextFilter(filter) {
  return dispatch => {
    dispatch({
      type: ADD_TEXT_FILTER,
      filter,
    });
  };
}

function removeTextFilter(filter) {
  return dispatch => {
    dispatch({
      type: REMOVE_TEXT_FILTER,
      filter,
    });
  };
}

// Exports
export {
  // action constants
  SET_FILTER,
  SET_ALL_FILTERS,
  ADD_TEXT_FILTER,
  REMOVE_TEXT_FILTER,
  // actions
  selectFilter,
  setAllFilters,
  resetFilters,
  addTextFilter,
  removeTextFilter,
};
