const SET_FILTER = 'SET_FILTER';

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

export {
  // action constants
  SET_FILTER,
  // actions
  selectFilter,
};
