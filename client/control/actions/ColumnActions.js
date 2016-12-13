import * as localForage from 'localforage';

const UPDATE_COLUMN = 'UPDATE_COLUMN';
const LOAD_SAVED_COLUMNS = 'LOAD_SAVED_COLUMNS';

function updateColumn({ index, isActive }) {
  return dispatch => {
    dispatch({
      type: UPDATE_COLUMN,
      index,
      isActive,
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
          type: LOAD_SAVED_COLUMNS,
          columns: found,
        });
      }
    });
  };
}

/**
 * Utility function to save the state via localForage.
 * Slightly weird since it doesn't actually dispatch anything
 *
 * @param  {Array}  state Filter state
 * @return {void}
 */
function saveLocalColumns(state) {
  localForage.setItem(STORAGE_ID, state);
}


// Exports
export {
  // action constants
  UPDATE_COLUMN,
  LOAD_SAVED_COLUMNS,
  // actions
  updateColumn,
  loadLocalColumns,
  saveLocalColumns,
};
