import { Popover, Tag } from 'antd';
import { Map } from 'immutable';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import { Link } from 'redux-little-router';

import {
  REVISION_APPROVED,
  REVISION_DISABLED,
  REVISION_LIVE,
  REVISION_PENDING_APPROVAL,
  REVISION_REJECTED,
} from 'control/state/constants';
import {
  getRevisionStatus,
} from 'control/state/app/revisions/selectors';


@connect(
  (state, { revision }) => ({
    status: getRevisionStatus(state, revision.get('id')),
  }),
)
export default class RevisionApprovalTag extends React.PureComponent {
  static propTypes = {
    revision: PropTypes.instanceOf(Map).isRequired,
    status: PropTypes.string,
  }

  static defaultProps = {
    status: null,
  }

  render() {
    const { revision, status } = this.props;

    const email = revision.getIn(['approval_request', 'creator', 'email']);

    let color;
    let label;
    let popoverContent;

    switch (status) {
      case REVISION_LIVE:
        color = 'green';
        label = 'Live';
        break;

      case REVISION_DISABLED:
        color = 'red';
        label = 'Disabled';
        break;

      case REVISION_APPROVED:
        color = 'green';
        label = 'Approved';
        break;

      case REVISION_REJECTED:
        color = 'red';
        label = 'Rejected';
        break;

      case REVISION_PENDING_APPROVAL:
        color = 'yellow';
        label = 'Pending Approval';
        break;

      default:
        return null;
    }

    if ([REVISION_LIVE, REVISION_DISABLED, REVISION_APPROVED, REVISION_REJECTED].includes(status)) {
      popoverContent = (
        <div>
          <div><strong>“{revision.getIn(['approval_request', 'comment'])}”</strong></div>
          <label>— {revision.getIn(['approval_request', 'approver', 'email'])}</label>
        </div>
      );
    } else {
      popoverContent = `Approval requested by ${email}`;
    }

    return (
      <Popover overlayClassName="timeline-popover" content={popoverContent} placement="right">
        <Link href={`/recipe/${revision.getIn(['recipe', 'id'])}/approval_history/`}>
          <Tag color={color}>
            {label}
          </Tag>
        </Link>
      </Popover>
    );
  }
}
