import { fromJS, Map } from 'immutable';

import {
  SERVICE_INFO_RECEIVE,
} from 'control_new/state/action-types';


export default function ser(state = new Map(), action) {
  switch (action.type) {
    case SERVICE_INFO_RECEIVE:
      return fromJS(action.serviceInfo);

    default:
      return state;
  }
}
