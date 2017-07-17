import { Popover, Tag } from 'antd';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import {
  REVISION_APPROVED,
  REVISION_DISABLED,
  REVISION_LIVE,
  REVISION_PENDING_APPROVAL,
  REVISION_REJECTED,
} from 'control_new/state/constants';
import {
  getRevisionStatus,
} from 'control_new/state/revisions/selectors';


@connect(
  (state, { revision }) => ({
    status: getRevisionStatus(state, revision.get('id')),
  }),
)
export default class RevisionApprovalTag extends React.Component {
  static propTypes = {
    revision: PropTypes.object.isRequired,
    status: PropTypes.string,
  }

  static defaultProps = {
    status: null,
  }

  render() {
    const { revision, status } = this.props;

    const email = revision.getIn(['approval_request', 'creator', 'email'])

    let color;
    let label;
    let popoverContent;

    if (status === REVISION_LIVE) {
      color = 'green';
      label = 'Live';
    } else if (status === REVISION_DISABLED) {
      color = 'red';
      label = 'Disabled';
    } else if (status === REVISION_APPROVED) {
      color = 'green';
      label = 'Approved';
    } else if (status === REVISION_REJECTED) {
      color = 'red';
      label = 'Rejected';
    } else if (status === REVISION_PENDING_APPROVAL) {
      color = 'yellow';
      label = 'Pending Approval';
    } else {
      return null;
    }

    if ([REVISION_LIVE, REVISION_DISABLED, REVISION_APPROVED, REVISION_REJECTED].includes(status)) {
      popoverContent = (
        <div>
          <div><strong>&quot;{revision.getIn(['approval_request', 'comment'])}&quot;</strong></div>
          <div><em>~ {revision.getIn(['approval_request', 'approver', 'email'])}</em></div>
        </div>
      );
    } else {
      popoverContent = `Approval requested by ${email}`;
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
