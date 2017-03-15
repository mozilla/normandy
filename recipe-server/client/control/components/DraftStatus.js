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

  let state = 'draft';

  const request = recipe.approval_request;
  state = request ? 'pending' : 'draft';

  if (request) {
    if (request.approved === true) {
      state = 'approved';
    } else if (request.approved === false) {
      state = 'rejected';
    }
  }

  // Flavor text consists of 'latest draft', 'last approved', etc
  const flavorText = [];

  const isLatestRevision = recipe.revision_id === latestRevisionId;
  const isLatestApproved = recipe.revision_id === lastApprovedRevisionId;

  if (isLatestRevision) {
    flavorText.push(STATUS_MESSAGES.latestDraft);
  }

  if (isLatestApproved) {
    flavorText.push(STATUS_MESSAGES.latestApproved);
  }

  const status = STATUS_MESSAGES[state];

  return (
    <div className={`status-indicator ${state}`}>
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
              flavorText.map((flavorFlav, index) => <div key={index} children={flavorFlav} />)
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
