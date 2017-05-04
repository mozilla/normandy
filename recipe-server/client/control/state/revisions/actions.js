import {
  REVISION_RECEIVE,
} from '../action-types';

import {
  makeApiRequest,
} from '../requests/actions';


export function fetchRevision(pk) {
  return async dispatch => {
    const requestId = `fetch-revision-${pk}`;
    const revision = await dispatch(makeApiRequest(requestId, `v2/recipe_revision/${pk}/`));

    dispatch({
      type: REVISION_RECEIVE,
      revision,
    });
  };
}


export function fetchAllRevisions() {
  return async dispatch => {
    const requestId = 'fetch-all-revisions';
    const revisions = await dispatch(makeApiRequest(requestId, 'v2/recipe_revision/'));

    revisions.forEach(revision => {
      dispatch({
        type: REVISION_RECEIVE,
        revision,
      });
    });
  };
}
