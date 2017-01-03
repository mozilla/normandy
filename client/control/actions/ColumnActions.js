import * as localForage from 'localforage';

export const UPDATE_COLUMN = 'UPDATE_COLUMN';
export const LOAD_SAVED_COLUMNS = 'LOAD_SAVED_COLUMNS';

export function updateColumn({ slug, isActive }) {
  return dispatch => {
    dispatch({
      type: UPDATE_COLUMN,
      slug,
      isActive,
    });
  };
}

// Exported for testing purposes
export const localStorageID = 'columns';

export function loadLocalColumns() {
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
export async function saveLocalColumns(state) {
  await localForage.setItem(localStorageID, state);
}
