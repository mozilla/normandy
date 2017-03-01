import React, { PropTypes as pt } from 'react';
import cx from 'classnames';

export default function DraftStatusIcon({
  request,
  className,
  statusText,
}) {
  // We know it's a draft if there is no approval request associated.
  const isDraft = !request;
  const draftClasses = isDraft && 'fa-circle-o';

  // Is the revision a draft that is in review?
  const isPending = request && request.approved === null;
  const pendingClasses = isPending && 'fa-question-circle';

  // Has the revision been reviewed and approved?
  const isApproved = request && request.approved;
  const approvedClasses = isApproved && 'fa-thumbs-up';

  // Has the revision been reviewed, but rejected?
  const isRejected = request && request.approved === false;
  const rejectedClasses = isRejected && 'fa-thumbs-down';

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
      title={statusText}
      className={cx(iconClass, className)}
    />
  );
}

DraftStatusIcon.propTypes = {
  request: pt.object,
  className: pt.string,
  statusText: pt.string,
};
