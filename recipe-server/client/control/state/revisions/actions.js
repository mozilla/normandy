import {
  REVISION_RECEIVE,
} from '../action-types';

import {
  makeApiRequest,
} from '../requests/actions';


function receiveRevision(revision) {
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
    .then(revision => receiveRevision(revision));
}


function receiveAllRevisions(revisions) {
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
    .then(revisions => receiveAllRevisions(revisions));
}
