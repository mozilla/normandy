import { fromJS, Map } from 'immutable';

import {
  SERVICE_INFO_RECEIVE,
} from 'control_new/state/action-types';


export default function ser(state = new Map(), action) {
  let serviceInfo;

  switch (action.type) {
    case SERVICE_INFO_RECEIVE:
      serviceInfo = fromJS(action.serviceInfo);

      serviceInfo = serviceInfo
        .set('user_id', serviceInfo.getIn(['user', 'id'], null))
        .remove('user');

      return serviceInfo;

    default:
      return state;
  }
}
