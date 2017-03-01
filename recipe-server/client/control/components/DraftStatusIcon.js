import React, { PropTypes as pt } from 'react';
import cx from 'classnames';

export const STATUS_ICONS = {
  draft: 'fa-pencil',
  pending: 'fa-question-circle-o',
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
  // Is the revision a draft that is in review?
  const isPending = request && request.approved === null;
  // Has the revision been reviewed, and approved?
  const isApproved = request && request.approved === true;
  // Has the revision been reviewed, but rejected?
  const isRejected = request && request.approved === false;

  // Compile all possible classes.
  const iconClass = cx(
    'draft-status-icon',
    'fa',
    'pre',
    isDraft && STATUS_ICONS.draft,
    isApproved && STATUS_ICONS.approved,
    isRejected && STATUS_ICONS.rejected,
    isPending && STATUS_ICONS.pending,
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
