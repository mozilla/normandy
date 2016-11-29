export const ADD_FILTER = 'ADD_FILTER';

function selectFilter({ group, option, isEnabled }) {
  return dispatch =>
    dispatch({
      type: ADD_FILTER,
      group,
      option,
      isEnabled,
    });
}

export default {
  // action constants
  ADD_FILTER,
  // actions
  selectFilter,
};
