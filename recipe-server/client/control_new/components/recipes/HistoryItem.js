import { Popover, Alert, Icon, Tag, Timeline } from 'antd';
import autobind from 'autobind-decorator';
import { Map } from 'immutable';
import PropTypes from 'prop-types';
import React from 'react';
import { Link } from 'redux-little-router';
import { connect } from 'react-redux';
import moment from 'moment';

import {
  REVISION_APPROVED,
  REVISION_DISABLED,
  REVISION_LIVE,
  REVISION_PENDING_APPROVAL,
  REVISION_REJECTED,
} from 'control_new/state/constants';

import {
  getRevisionStatus,
  isLatestRevision as isLatestRevisionSelector,
} from 'control_new/state/app/revisions/selectors';

@connect(
  (state, { revision }) => ({
    status: getRevisionStatus(state, revision.get('id')),
    isLatestRevision: id => isLatestRevisionSelector(state, id),
  }),
)
@autobind
export default class HistoryItem extends React.PureComponent {
  static propTypes = {
    isLatestRevision: PropTypes.func.isRequired,
    revision: PropTypes.instanceOf(Map).isRequired,
    status: PropTypes.instanceOf(Map).isRequired,
    selectedRevisionId: PropTypes.string.isRequired,
    recipeId: PropTypes.string.isRequired,
    revisionNo: PropTypes.number.isRequired,
  };

  getPopupDialog() {
    const { revision } = this.props;
    const requestCreationTime = moment(revision.getIn(['approval_request', 'created']));
    const requestCreator = revision.getIn(['approval_request', 'creator', 'email']);

    const isApproved = revision.getIn(['approval_request', 'approved']);
    const approver = revision.getIn(['approval_request', 'approver', 'email']);

    const revisionCreationTime = moment(revision.get('date_created'));

    // Creator info is on every tooltip, contains basic metadata.
    const revisionInfoContent = (
      <div>
        Revision added:
          <b title={revisionCreationTime.format('MMMM Do YYYY, h:mm a')}>
            { ` ${revisionCreationTime.format('L')} ` }
          </b>
          ({ revisionCreationTime.fromNow() })
      </div>
    );

    // Default to displaying just the creator info.
    const popoverContent = <div className="revision-info">{revisionInfoContent}</div>;


    if (!revision.get('approval_request')) {
      return popoverContent;
    }

    const hasApprovalStatus = isApproved === true || isApproved === false;

    return (
      <div className="revision-info">
        { revisionInfoContent }
        <hr />
        Approval requested by: <b>{requestCreator}</b><br />
        Date requested:
        <b title={requestCreationTime.format('MMMM Do YYYY, h:mm a')}>
          { ` ${requestCreationTime.format('L')} ` }
        </b>
        ({ requestCreationTime.fromNow() })
        {
          hasApprovalStatus && <hr />
        }

        {
          hasApprovalStatus &&
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
        }
      </div>
    );
  }

  getRevisionStyles() {
    const { revision, status } = this.props;
    let color = 'grey';
    let label;
    let iconType;

    switch (status) {
      case REVISION_LIVE:
        color = 'green';
        label = 'Live';
        iconType = 'check-circle';
        break;

      case REVISION_DISABLED:
        color = 'red';
        label = 'Disabled';
        iconType = 'close-circle';
        break;

      case REVISION_APPROVED:
        color = 'green';
        label = 'Approved';
        iconType = 'check-circle';
        break;

      case REVISION_REJECTED:
        color = 'red';
        label = 'Rejected';
        iconType = 'close-circle';
        break;

      case REVISION_PENDING_APPROVAL:
        color = 'yellow';
        label = 'Pending Approval';
        iconType = 'clock-circle-o';
        break;

      default:
        break;
    }

    // If the revision is the currently viewed revision, override the icon and color.
    if (revision.get('id') === this.props.selectedRevisionId) {
      color = 'blue';
      iconType = 'circle-left';
    }

    const icon = !iconType ? null : (
      <Icon
        type={iconType}
        color={color}
        style={{ fontSize: '16px' }}
      />
    );

    return {
      icon,
      color,
      label,
    };
  }

  render() {
    const { recipeId, revision, isLatestRevision, revisionNo } = this.props;
    let url = `/recipe/${recipeId}`;
    if (!isLatestRevision(revision.get('id'))) {
      url += `/rev/${revision.get('id')}`;
    }

    const popup = this.getPopupDialog();
    const { icon, color, label } = this.getRevisionStyles();

    return (
      <Timeline.Item
        color={color}
        dot={icon}
        key={revision.get('id')}
      >
        <Popover overlayClassName="timeline-popover" content={popup} placement="left">
          <Link href={url}>
            <Tag color={icon && color}>
              {`Revision ${revisionNo}`}
            </Tag>
          </Link>

          {
            label &&
              <Link href={`/recipe/${recipeId}/approval_history`}>
                <Tag color={color}>
                  {label}
                </Tag>
              </Link>
          }
        </Popover>
      </Timeline.Item>
    );
  }
}
