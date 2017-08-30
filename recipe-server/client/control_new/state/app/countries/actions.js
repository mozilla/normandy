import {
  COUNTRIES_RECEIVE,
} from 'control_new/state/action-types';
import {
  makeApiRequest,
} from 'control_new/state/app/requests/actions';

export function countriesReceived(countries) {
  return dispatch => {
    dispatch({
      type: COUNTRIES_RECEIVE,
      countries,
    });
  };
}

export function fetchCountries() {
  return async dispatch => {
    const requestId = 'fetch-countries';
    const filters = await dispatch(makeApiRequest(requestId, 'v1/filters/'));
    dispatch(countriesReceived(filters.countries));
  };
}
