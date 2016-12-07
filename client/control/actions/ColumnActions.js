import * as localForage from 'localforage';

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


const STORAGE_ID = 'columns';

function loadLocalColumns() {
  return dispatch => {
    // load the column settings the user last used
    localForage.getItem(STORAGE_ID, (err, found) => {
      if (!err && found && found.length) {
        dispatch({
          type: SET_COLUMNS,
          columns: found,
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
function saveLocalColumns(state) {
  return () => {
    localForage.setItem(STORAGE_ID, state);
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
  loadLocalColumns,
  saveLocalColumns,
};
