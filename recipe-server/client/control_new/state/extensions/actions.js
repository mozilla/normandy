import {
  EXTENSION_RECEIVE,
} from 'control_new/state/action-types';
import {
  makeApiRequest,
} from 'control_new/state/requests/actions';


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


function prepareExtensionFormData(extensionData) {
  const data = new FormData();

  Object.keys(extensionData).forEach(key => {
    data.append(key, extensionData[key]);
  });

  return data;
}


export function createExtension(extensionData) {
  return async dispatch => {
    const requestId = 'create-extension';
    const extension = await dispatch(makeApiRequest(requestId, 'v2/extension/', {
      method: 'POST',
      body: prepareExtensionFormData(extensionData),
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
      body: prepareExtensionFormData(extensionData),
    }));
    dispatch({
      type: EXTENSION_RECEIVE,
      extension,
    });
  };
}
