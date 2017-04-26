import {
  REVISION_RECEIVE,
} from '../action-types';

import {
  makeApiRequest,
} from '../requests/actions';


function fetchRevisionSuccess(revision) {
  return dispatch => {
    dispatch({
      type: REVISION_RECEIVE,
      revision,
    });
  };
}


export function fetchRevision(pk) {
  const requestId = `fetch-${pk}`;
  return makeApiRequest(requestId, `recipe_revision/${pk}/`, { method: 'GET' })
    .then(revision => fetchRevisionSuccess(revision));
}


function fetchAllRevisionsSuccess(revisions) {
  return dispatch => {
    revisions.forEach(revision => {
      dispatch({
        type: REVISION_RECEIVE,
        revision,
      });
    });
  };
}

export function fetchAllRevisions() {
  const requestId = 'fetch-all';
  return makeApiRequest(requestId, 'recipe_revision/', { method: 'GET' })
    .then(revisions => fetchAllRevisionsSuccess(revisions));
}
