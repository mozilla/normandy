import { Alert, Popover, Tag } from 'antd';
import autobind from 'autobind-decorator';
import { Map } from 'immutable';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import { Link } from 'redux-little-router';
import moment from 'moment';

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
@autobind
export default class RevisionApprovalTag extends React.PureComponent {
  static propTypes = {
    revision: PropTypes.instanceOf(Map).isRequired,
    status: PropTypes.string,
  };

  static defaultProps = {
    status: null,
  };

  generatePopupDialog() {
    const { revision, status } = this.props;
    const createdTime = moment(revision.getIn(['approval_request', 'created']));
    const creator = revision.getIn(['approval_request', 'creator', 'email']);

    const isApproved = revision.getIn(['approval_request', 'approved']);
    const approver = revision.getIn(['approval_request', 'approver', 'email']);

    // Creator info is on every tooltip, contains basic metadata.
    const creatorInfoContent = (
      <div>
        Requested by: <b>{creator}</b><br />
        Date requested:
          <b title={createdTime.format('MMMM Do YYYY, h:mm a')}>
            { ` ${createdTime.format('L')} ` }
          </b>
          ({ createdTime.fromNow() })
      </div>
    );

    // Default to displaying just the creator info.
    let popoverContent = <div className="revision-info">{creatorInfoContent}</div>;

    // If we have a status that indicates a response to the approval request,
    // then we need to add an appropriate message and include the saved comment.
    if ([REVISION_LIVE, REVISION_DISABLED, REVISION_APPROVED, REVISION_REJECTED].includes(status)) {
      popoverContent = (
        <div className="revision-info">
          { creatorInfoContent }
          <hr />
          <Alert
            className="request-comment"
            banner
            type={isApproved === true ? 'success' : 'error'}
            showIcon
            message={
              <span>
                <strong>“{revision.getIn(['approval_request', 'comment'])}”</strong>
                <label>— {approver}</label>
              </span>
            }
          />
        </div>
      );
    }

    return popoverContent;
  }

  generateTagStyles() {
    const { status } = this.props;

    let color = null;
    let label = null;

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
        break;
    }

    return { color, label };
  }

  render() {
    const { revision } = this.props;
    const { color, label } = this.generateTagStyles();
    const content = this.generatePopupDialog();

    return (
      <Popover overlayClassName="timeline-popover" content={content} placement="left">
        <Link href={`/recipe/${revision.getIn(['recipe', 'id'])}/approval_history/`}>
          {
            label &&
            <Tag color={color}>
              {label}
            </Tag>
          }
        </Link>
      </Popover>
    );
  }
}
