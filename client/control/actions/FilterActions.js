const SET_FILTER = 'SET_FILTER';
const LOAD_LAST_FILTERS = 'LOAD_LAST_FILTERS';

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

function loadLastFilters(state) {
  return dispatch => {
    dispatch({
      type: LOAD_LAST_FILTERS,
      state,
    });
  };
}

export {
  // action constants
  SET_FILTER,
  LOAD_LAST_FILTERS,
  // actions
  selectFilter,
  loadLastFilters,
};
