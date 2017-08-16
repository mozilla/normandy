import {
  CHANNELS_RECEIVE,
} from 'control_new/state/action-types';
import {
  makeApiRequest,
} from 'control_new/state/app/requests/actions';

export function channelsReceived(channels) {
  return dispatch => {
    dispatch({
      type: CHANNELS_RECEIVE,
      channels,
    });
  };
}

export function fetchChannels() {
  return async dispatch => {
    const requestId = 'fetch-channels';
    const filters = await dispatch(makeApiRequest(requestId, 'v1/filters/'));
    dispatch(channelsReceived(filters.channels));
  };
}
