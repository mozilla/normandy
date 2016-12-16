import * as localForage from 'localforage';

const LOAD_FILTERS = 'LOAD_FILTERS';
const SET_FILTER = 'SET_FILTER';
const SET_ALL_FILTERS = 'SET_ALL_FILTERS';
const ADD_TEXT_FILTER = 'ADD_TEXT_FILTER';
const REMOVE_TEXT_FILTER = 'REMOVE_TEXT_FILTER';

function loadFilters() {
  return dispatch => {
    dispatch({
      type: LOAD_FILTERS,
      filters: [{
        status: [
          'enabled',
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
          'en-uk',
          'en-us',
        ],
        country: [
          'CA',
          'RU',
          'US',
        ],
      }],
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
      type: SET_FILTER,
      group,
      option,
      isEnabled,
    });
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


const STORAGE_ID = 'last-filters';

function loadLocalFilters() {
  return dispatch => {
    // load the column settings the user last used
    localForage.getItem(STORAGE_ID, (err, found) => {
      if (!err && found && found.length) {
        dispatch({
          type: SET_ALL_FILTERS,
          filters: found,
        });
      }
    });
  };
}

/**
 * Utility function to save the state via localForage.
 *
 * @param  {Array}  state Filter state
 * @return {void}
 */
function saveLocalFilters(state) {
  return () => {
    localForage.setItem(STORAGE_ID, state);
  };
}

// Exports
export {
  // action constants
  SET_FILTER,
  SET_ALL_FILTERS,
  ADD_TEXT_FILTER,
  REMOVE_TEXT_FILTER,
  LOAD_FILTERS,
  // actions
  loadFilters,
  selectFilter,
  setAllFilters,
  resetFilters,
  loadLocalFilters,
  saveLocalFilters,
};
