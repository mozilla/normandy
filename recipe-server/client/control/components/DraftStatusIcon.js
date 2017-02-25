import React, { PropTypes as pt } from 'react';
import cx from 'classnames';

export default function DraftStatusIcon({
  request,
  className,
  statusText,
}) {
  // has this revision been approved/published?
  const approvedClasses = request && request.approved && 'fa-check-circle-o';

  // we know it's a draft if it doesnt have an approval, and hasn't been approved before
  const isDraft = !request;
  const draftClasses = isDraft && 'fa-circle-o';

  // is the revision a draft that is in review?
  const isPending = request && !request.approved;
  const pendingClasses = isPending && 'fa-dot-circle-o';

  // compile all possible classes
  const iconClass = cx(
    'draft-status-icon',
    'fa',
    'pre',
    approvedClasses,
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
