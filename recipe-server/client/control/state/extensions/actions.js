import {
  EXTENSION_RECEIVE,
} from '../action-types';

import {
  makeApiRequest,
} from '../requests/actions';


export function fetchExtension(pk) {
  return async dispatch => {
    const requestId = `fetch-extension-${pk}`;
    const extension = await dispatch(makeApiRequest(requestId, `v2/extension/${pk}/`));

    dispatch({
      type: EXTENSION_RECEIVE,
      extension,
    });
  };
}


export function fetchAllExtensions() {
  return async dispatch => {
    const requestId = 'fetch-all-extensions';
    const extensions = await dispatch(makeApiRequest(requestId, 'v2/extension/'));

    extensions.forEach(extension => {
      dispatch({
        type: EXTENSION_RECEIVE,
        extension,
      });
    });
  };
}
