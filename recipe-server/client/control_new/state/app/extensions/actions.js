import * as localForage from 'localforage';

import {
  EXTENSION_LISTING_COLUMNS_CHANGE,
  EXTENSION_PAGE_RECEIVE,
  EXTENSION_RECEIVE,
} from 'control_new/state/action-types';
import {
  makeApiRequest,
} from 'control_new/state/app/requests/actions';


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


export function fetchExtensionsPage(pageNumber = 1) {
  return async dispatch => {
    const requestId = `fetch-extensions-page-${pageNumber}`;
    const extensions = await dispatch(makeApiRequest(requestId, 'v2/extension/', {
      data: { page: pageNumber },
    }));

    extensions.results.forEach(extension => {
      dispatch({
        type: EXTENSION_RECEIVE,
        extension,
      });
    });

    dispatch({
      type: EXTENSION_PAGE_RECEIVE,
      pageNumber,
      extensions,
      isLastPage: extensions.results.next === null,
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
    return extension.id;
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

export function loadExtensionListingColumns() {
  return async dispatch => {
    const columns = await localForage.getItem('extension_listing_columns');

    if (columns) {
      dispatch({
        type: EXTENSION_LISTING_COLUMNS_CHANGE,
        columns,
      });
    }
  };
}

export function saveExtensionListingColumns(columns) {
  return dispatch => {
    localForage.setItem('extension_listing_columns', columns);

    dispatch({
      type: EXTENSION_LISTING_COLUMNS_CHANGE,
      columns,
    });
  };
}

