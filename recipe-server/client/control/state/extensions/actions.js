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


export function createExtension(extensionData) {
  return async dispatch => {
    const requestId = 'create-extension';
    const extension = await dispatch(makeApiRequest(requestId, 'v2/extension/', {
      method: 'POST',
      data: extensionData,
    }));
    dispatch({
      type: EXTENSION_RECEIVE,
      extension,
    });
  };
}


export function updateExtension(pk, extensionData) {
  return async dispatch => {
    const requestId = `update-extension-${pk}`;
    const extension = await dispatch(makeApiRequest(requestId, `v2/extension/${pk}/`, {
      method: 'PATCH',
      data: extensionData,
    }));
    dispatch({
      type: EXTENSION_RECEIVE,
      extension,
    });
  };
}
