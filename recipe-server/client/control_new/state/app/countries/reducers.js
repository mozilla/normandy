import { fromJS, List } from 'immutable';

import {
  COUNTRIES_RECEIVE,
} from 'control_new/state/action-types';


export default function countries(state = new List(), action) {
  switch (action.type) {
    case COUNTRIES_RECEIVE:
      return fromJS(action.countries);

    default:
      return state;
  }
}

