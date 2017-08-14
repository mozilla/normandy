import * as localForage from 'localforage';

import {
  LOCALES_RECEIVE,
} from 'control_new/state/action-types';
import {
  makeApiRequest,
} from 'control_new/state/app/requests/actions';

export function localesReceived(locales) {
  return dispatch => {
    dispatch({
      type: LOCALES_RECEIVE,
      locales,
    });
  };
}

export function fetchLocales() {
  return async dispatch => {
    const requestId = 'fetch-locales';
    const filters = await dispatch(makeApiRequest(requestId, `v1/filters/`));
    dispatch(localesReceived(filters.locales));
  };
}
