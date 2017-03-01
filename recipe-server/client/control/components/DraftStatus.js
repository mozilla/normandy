import React, { PropTypes as pt } from 'react';
import DraftStatusIcon from 'control/components/DraftStatusIcon';

export const STATUS_MESSAGES = {
  draft: 'Draft',
  pending: 'Pending Review',
  approved: 'Approved',
  rejected: 'Rejected',
  latestDraft: 'Latest Draft',
  latestApproved: 'Latest Approved',
};

export default function DraftStatus(props) {
  const {
    recipe,
    latestRevisionId,
    lastApprovedRevisionId,
  } = props;

  const request = recipe.approval_request;
  let status = request ? STATUS_MESSAGES.pending : STATUS_MESSAGES.draft;
  const flavorText = [];

  if (request) {
    if (request.approved === true) {
      status = STATUS_MESSAGES.approved;
    } else if (request.approved === false) {
      status = STATUS_MESSAGES.rejected;
    }
  }

  const isLatestRevision = recipe.revision_id === latestRevisionId;
  const isLatestApproved = recipe.revision_id === lastApprovedRevisionId;

  if (isLatestRevision) {
    flavorText.push(STATUS_MESSAGES.latestDraft);
  }

  if (isLatestApproved) {
    flavorText.push(STATUS_MESSAGES.latestApproved);
  }

  return (
    <div className={'status-indicator'}>
      <DraftStatusIcon
        request={request}
        altText={status}
        isLatestRevision={isLatestRevision}
      />
      <div className="status-text">
        <span>{status}</span>
        {
          !!flavorText.length &&
            <div className="flavor-text">{
              flavorText.map(flavorFlav => <div children={flavorFlav} />)
            }</div>
        }
      </div>
    </div>
  );
}
DraftStatus.propTypes = {
  recipe: pt.object.isRequired,
  latestRevisionId: pt.string,
  lastApprovedRevisionId: pt.string,
};
