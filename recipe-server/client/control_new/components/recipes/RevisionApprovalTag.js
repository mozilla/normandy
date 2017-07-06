import { Popover, Tag } from 'antd';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import {
  isApprovedRevision,
  isLiveRevision,
  isRejectedRevision,
  isRevisionPendingApproval,
} from 'control_new/state/revisions/selectors';


@connect(
  (state, { revision }) => ({
    isApproved: isApprovedRevision(state, revision.get('id')),
    isLive: isLiveRevision(state, revision.get('id')),
    isRejected: isRejectedRevision(state, revision.get('id')),
    isPendingApproval: isRevisionPendingApproval(state, revision.get('id')),
  }),
)
export default class RevisionApprovalTag extends React.Component {
  static propTypes = {
    isApproved: PropTypes.bool.isRequired,
    isLive: PropTypes.bool.isRequired,
    isRejected: PropTypes.bool.isRequired,
    isPendingApproval: PropTypes.bool.isRequired,
    revision: PropTypes.object.isRequired,
  }

  render() {
    const { isApproved, isLive, isRejected, isPendingApproval, revision } = this.props;

    let color;
    let label;
    let popoverContent;

    if (isLive) {
      color = 'green';
      label = 'Live';
    } else if (isApproved) {
      color = 'green';
      label = 'Approved';
    } else if (isRejected) {
      color = 'red';
      label = 'Rejected';
    } else if (isPendingApproval) {
      color = 'yellow';
      label = 'Pending Approval';
    } else {
      return null;
    }

    if (isLive || isApproved || isRejected) {
      popoverContent = (
        <div>
          <div><strong>&quot;{revision.getIn(['approval_request', 'comment'])}&quot;</strong></div>
          <div><em>~ {revision.getIn(['approval_request', 'approver', 'email'])}</em></div>
        </div>
      );
    } else {
      popoverContent = `Approval requested by ${revision.getIn(['approval_request', 'creator', 'email'])}`;
    }

    return (
      <Popover content={popoverContent}>
        <Tag color={color}>
          {label}
        </Tag>
      </Popover>
    );
  }
}
