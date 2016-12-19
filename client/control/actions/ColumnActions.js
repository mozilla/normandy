import * as localForage from 'localforage';

const UPDATE_COLUMN = 'UPDATE_COLUMN';
const LOAD_SAVED_COLUMNS = 'LOAD_SAVED_COLUMNS';

function updateColumn({ value, isActive }) {
  return dispatch => {
    dispatch({
      type: UPDATE_COLUMN,
      value,
      isActive,
    });
  };
}

const localStorageID = 'columns';

function loadLocalColumns() {
  return dispatch =>
    // load the column settings the user last used
    localForage
      .getItem(localStorageID)
      .then(found => {
        if (found && found.length) {
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
 * @return {void}
 */
async function saveLocalColumns(state) {
  await localForage.setItem(localStorageID, state);
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
