import { Map } from 'immutable';

import { getAction } from 'control_new/state/actions/selectors';
import { getRecipe, isRecipeEnabled } from 'control_new/state/recipes/selectors';

export function getRevision(state, id, defaultsTo = null) {
  const revision = state.app.revisions.items.get(id);

  if (revision) {
    const action = getAction(state, revision.getIn(['recipe', 'action_id']));

    return revision
      .setIn(['recipe', 'action'], action)
      .removeIn(['recipe', 'action_id']);
  }

  return defaultsTo;
}

export function getRecipeForRevision(state, id, defaultsTo = null) {
  const revision = getRevision(state, id, new Map());
  return revision.get('recipe', defaultsTo);
}

export function getRecipeIdForRevision(state, id, defaultsTo = null) {
  const recipe = getRecipeForRevision(state, id, new Map());
  return recipe.get('id', defaultsTo);
}

export function isLatestRevision(state, id) {
  const recipe = getRecipe(state, getRecipeIdForRevision(state, id), new Map());
  return recipe.getIn(['latest_revision', 'id']) === id;
}

export function isLiveRevision(state, id) {
  const revision = getRevision(state, id, new Map());
  return isRecipeEnabled(state, revision.getIn(['recipe', 'id'])) && isLatestRevision(state, id);
}

export function isApprovedRevision(state, id) {
  const revision = getRevision(state, id, new Map());
  return revision.getIn(['approval_request', 'approved'], false);
}

export function isRejectedRevision(state, id) {
  const revision = getRevision(state, id, new Map());
  return revision.getIn(['approval_request', 'approved']) === false;
}

export function isRevisionPendingApproval(state, id) {
  const revision = getRevision(state, id, new Map());
  return revision.getIn(['approval_request', 'approved']) === null;
}

export function isLatestApprovedRevision(state, id) {
  const recipe = getRecipe(state, getRecipeIdForRevision(state, id), new Map());
  return recipe.getIn(['approved_revision', 'id']) === id;
}
