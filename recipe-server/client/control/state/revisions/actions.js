import {
  ACTION_RECEIVE,
  REVISION_RECEIVE,
} from '../action-types';

import {
  makeApiRequest,
} from '../requests/actions';


function revisionReceived(revision) {
  return dispatch => {
    dispatch({
      type: REVISION_RECEIVE,
      revision,
    });

    dispatch({
      type: ACTION_RECEIVE,
      action: revision.recipe.action,
    });
  };
}


export function fetchRevision(pk) {
  return async dispatch => {
    const requestId = `fetch-revision-${pk}`;
    const revision = await dispatch(makeApiRequest(requestId, `v2/recipe_revision/${pk}/`));
    dispatch(revisionReceived(revision));
  };
}


export function fetchAllRevisions() {
  return async dispatch => {
    const requestId = 'fetch-all-revisions';
    const revisions = await dispatch(makeApiRequest(requestId, 'v2/recipe_revision/'));

    revisions.forEach(revision => {
      dispatch(revisionReceived(revision));
    });
  };
}
