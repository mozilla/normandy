/* eslint-disable import/prefer-default-export */

/**
 * Recipes selectors
 */
import moment from 'moment';

export function getLastApprovedRevision(revisions) {
  return [].concat(Object.keys(revisions || {}))
    // Array of revision objects
    .map(id => revisions[id])
    // Which have approval requests
    .filter(rev => !!rev.approval_request)
    // Which are confirmed approved
    .filter(rev => rev.approval_request.approved === true)
    .reduce((prev, current) => {
      if (!prev.approval_request) {
        return current;
      }

      const prevTime = moment().diff(prev.approval_request.created);
      const currentTime = moment().diff(current.approval_request.created);

      return prevTime < currentTime ? prev : current;
    }, {});
}

export function getLatestRevision(revisions) {
  return [].concat(Object.keys(revisions || {}))
    // Array of revision objects
    .map(id => revisions[id])
    .reduce((prev, current) => {
      if (!prev.approval_request) {
        return current;
      }

      const prevTime = moment().diff(prev.approval_request.created);
      const currentTime = moment().diff(current.approval_request.created);

      return prevTime < currentTime ? prev : current;
    }, {});
}
