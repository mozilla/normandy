import { fromJS, List } from 'immutable';

import {
  CHANNELS_RECEIVE,
} from 'control_new/state/action-types';


export default function channels(state = new List(), action) {
  switch (action.type) {
    case CHANNELS_RECEIVE:
      return fromJS(action.channels);

    default:
      return state;
  }
}

