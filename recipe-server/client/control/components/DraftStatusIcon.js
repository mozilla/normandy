import React, { PropTypes as pt } from 'react';
import cx from 'classnames';

export const STATUS_ICONS = {
  draft: 'fa-circle-o',
  pending: 'fa-question-circle',
  approved: 'fa-thumbs-up',
  rejected: 'fa-thumbs-down',
};

export default function DraftStatusIcon({
  request,
  className,
  altText,
}) {
  // We know it's a draft if there is no approval request associated.
  const isDraft = !request;
  const draftClasses = isDraft && STATUS_ICONS.draft;

  // Is the revision a draft that is in review?
  const isPending = request && request.approved === null;
  const pendingClasses = isPending && STATUS_ICONS.pending;

  // Has the revision been reviewed, and approved?
  const isApproved = request && request.approved;
  const approvedClasses = isApproved && STATUS_ICONS.approved;

  // Has the revision been reviewed, but rejected?
  const isRejected = request && request.approved === false;
  const rejectedClasses = isRejected && STATUS_ICONS.rejected;

  // Compile all possible classes.
  const iconClass = cx(
    'draft-status-icon',
    'fa',
    'pre',
    approvedClasses,
    rejectedClasses,
    draftClasses,
    pendingClasses,
  );

  return (
    <i
      title={altText}
      className={cx(iconClass, className)}
    />
  );
}

DraftStatusIcon.propTypes = {
  request: pt.object,
  className: pt.string,
  altText: pt.string,
};
