import { fromJS, Map } from 'immutable';
import { combineReducers } from 'redux';

import {
  RECIPE_DELETE,
  RECIPE_RECEIVE,
  RECIPE_FILTERS_RECEIVE,
  RECIPE_HISTORY_RECEIVE,
} from '../action-types';


function filters(state = new Map(), action) {
  switch (action.type) {
    case RECIPE_FILTERS_RECEIVE:
      return fromJS(action.filters);

    default:
      return state;
  }
}


function history(state = new Map(), action) {
  switch (action.type) {
    case RECIPE_HISTORY_RECEIVE:
      return state.set(action.recipeId, fromJS(action.revisions.map(revision => revision.id)));

    case RECIPE_DELETE:
      return state.remove(action.recipeId);

    default:
      return state;
  }
}


function items(state = new Map(), action) {
  let recipe;

  switch (action.type) {
    case RECIPE_RECEIVE:
      recipe = fromJS(action.recipe);

      recipe = recipe
        .set('action_id', recipe.getIn(['action', 'id'], null))
        .set('latest_revision_id', recipe.getIn(['latest_revision', 'id'], null))
        .set('approved_revision_id', recipe.getIn(['approved_revision', 'id'], null))
        .remove('action')
        .remove('latest_revision')
        .remove('approved_revision');

      return state.set(action.recipe.id, recipe);

    case RECIPE_DELETE:
      return state.remove(action.recipeId);

    default:
      return state;
  }
}


export default combineReducers({
  filters,
  history,
  items,
});
