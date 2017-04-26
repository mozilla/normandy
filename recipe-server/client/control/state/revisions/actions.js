import {
  REVISION_RECEIVE,
} from '../action-types';

import {
  makeApiRequest,
} from '../requests/actions';


export function fetchRevision(pk) {
  return async dispatch => {
    const requestId = `fetch-revision-${pk}`;
    const response = dispatch(
      makeApiRequest(requestId, `recipe_revision/${pk}/`, { method: 'GET' }));
    const revision = await response;

    dispatch({
      type: REVISION_RECEIVE,
      revision,
    });
  };
}


export function fetchAllRevisions() {
  return async dispatch => {
    const requestId = 'fetch-all-revisions';
    const response = dispatch(makeApiRequest(requestId, 'recipe_revision/', { method: 'GET' }));
    const revisions = await response;

    revisions.forEach(revision => {
      dispatch({
        type: REVISION_RECEIVE,
        revision,
      });
    });
  };
}
