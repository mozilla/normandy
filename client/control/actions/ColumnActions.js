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

const localStorageID = 'columns';

function loadLocalColumns() {
  return dispatch =>
    // load the column settings the user last used
    localForage.getItem(localStorageID, (err, found) => {
      if (!err && found && found.length) {
        dispatch({
          type: LOAD_SAVED_COLUMNS,
          columns: found,
        });
      }
    });
}

/**
 * Utility function to save the state via localForage.
 * Slightly weird since it doesn't actually dispatch anything
 *
 * @param  {Array}     state    Filter state
 * @param  {Function}  callback (Optional) callback function
 * @return {void}
 */
function saveLocalColumns(state, callback) {
  localForage.setItem(localStorageID, state, callback);
}


// Exports
export {
  // used for testing
  localStorageID,
  // action constants
  UPDATE_COLUMN,
  LOAD_SAVED_COLUMNS,
  // actions
  updateColumn,
  loadLocalColumns,
  saveLocalColumns,
};
