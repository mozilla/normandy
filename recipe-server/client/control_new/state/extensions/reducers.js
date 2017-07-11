import { fromJS, Map } from 'immutable';
import { combineReducers } from 'redux';

import {
  EXTENSION_LISTING_COLUMNS_CHANGE,
  EXTENSION_PAGE_RECEIVE,
  EXTENSION_RECEIVE,
} from 'control_new/state/action-types';
import {
  EXTENSION_LISTING_COLUMNS,
} from 'control_new/state/constants';


function items(state = new Map(), action) {
  switch (action.type) {
    case EXTENSION_RECEIVE:
      return state.set(action.extension.id, fromJS(action.extension));

    default:
      return state;
  }
}


function listing(state = new Map(), action) {
  switch (action.type) {
    case EXTENSION_PAGE_RECEIVE:
      return state
        .set('count', action.extensions.count)
        .set('pageNumber', action.pageNumber)
        .set('results', fromJS(action.extensions.results.map(extension => extension.id)));

    case EXTENSION_LISTING_COLUMNS_CHANGE:
      return state.set('columns', EXTENSION_LISTING_COLUMNS.filter(column => (
        action.columns.includes(column)
      )));

    default:
      return state;
  }
}


export default combineReducers({
  items,
  listing,
});
