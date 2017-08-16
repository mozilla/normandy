import { fromJS, List } from 'immutable';

import {
  LOCALES_RECEIVE,
} from 'control_new/state/action-types';


export default function locales(state = new List(), action) {
  switch (action.type) {
    case LOCALES_RECEIVE:
      return fromJS(action.locales);

    default:
      return state;
  }
}

