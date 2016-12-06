const UPDATE_COLUMN = 'UPDATE_COLUMN';
const SET_COLUMNS = 'SET_COLUMNS';


function updateColumn({ index, isActive }) {
  return dispatch => {
    dispatch({
      type: UPDATE_COLUMN,
      index,
      isActive,
    });
  };
}

function setColumns(columns) {
  return dispatch => {
    dispatch({
      type: SET_COLUMNS,
      columns,
    });
  };
}


// Exports
export {
  // action constants
  UPDATE_COLUMN,
  SET_COLUMNS,
  // actions
  updateColumn,
  setColumns,
};
