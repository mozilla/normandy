import { Alert, Icon, Popover, Tag, Timeline } from 'antd';
import autobind from 'autobind-decorator';
import { Map } from 'immutable';
import React from 'react';
import { connect } from 'react-redux';
import { Link } from 'redux-little-router';
import moment from 'moment';
import PropTypes from 'prop-types';

import {
  REVISION_APPROVED,
  REVISION_DISABLED,
  REVISION_LIVE,
  REVISION_PENDING_APPROVAL,
  REVISION_REJECTED,
} from 'control/state/constants';

import {
  getRevisionStatus,
  isLatestRevision as isLatestRevisionSelector,
} from 'control/state/app/revisions/selectors';

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

  static STATUS_STYLES = {
    [REVISION_LIVE]: {
      color: 'green',
      iconType: 'check-circle',
      label: 'Live',
    },
    [REVISION_DISABLED]: {
      color: 'red',
      iconType: 'close-circle',
      label: 'Disabled',
    },
    [REVISION_APPROVED]: {
      color: 'green',
      iconType: 'check-circle',
      label: 'Approved',
    },
    [REVISION_REJECTED]: {
      color: 'red',
      iconType: 'close-circle',
      label: 'Rejected',
    },
    [REVISION_PENDING_APPROVAL]: {
      color: 'yellow',
      iconType: 'clock-circle-o',
      label: 'Pending Approval',
    },
  };

  getRevisionStyles() {
    const { revision, status } = this.props;

    // Grab the status style from the static definition, alternatively fall back
    // to empty/'bland' display values.
    const styles = HistoryItem.STATUS_STYLES[status] || {};

    let { color = 'grey', iconType } = styles;
    const { label } = styles;

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

  getRevisionUrl() {
    const { recipeId, revision, isLatestRevision } = this.props;
    let url = `/recipe/${recipeId}/`;

    if (!isLatestRevision(revision.get('id'))) {
      url = `${url}rev/${revision.get('id')}/`;
    }

    return url;
  }

  render() {
    const { recipeId, revision, revisionNo } = this.props;
    const url = this.getRevisionUrl();

    const { icon, color, label } = this.getRevisionStyles();

    return (
      <Timeline.Item
        color={color}
        dot={icon}
        key={revision.get('id')}
      >
        <Popover
          overlayClassName="timeline-popover"
          content={<HistoryItemPopover revision={revision} />}
          placement="left"
        >
          <Link href={url}>
            <Tag color={icon && color}>
              {`Revision ${revisionNo}`}
            </Tag>
          </Link>

          {
            label &&
              <Link href={`/recipe/${recipeId}/approval_history/`}>
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

export class HistoryItemPopover extends React.PureComponent {
  static propTypes = {
    revision: PropTypes.instanceOf(Map).isRequired,
  };

  render() {
    const { revision } = this.props;

    return (
      <div className="revision-info">
        <RevisionInfo revision={revision} />
        <RequestInfo revision={revision} />
        <ApprovalComment revision={revision} />
      </div>
    );
  }
}

export class RevisionInfo extends React.PureComponent {
  static propTypes = {
    revision: PropTypes.instanceOf(Map).isRequired,
  };

  render() {
    const { revision } = this.props;
    const revisionCreationTime = moment(revision.get('date_created'));

    const fullTime = revisionCreationTime.format('MMMM Do YYYY, h:mm a');
    const simpleTime = revisionCreationTime.format('L');
    const timeAgo = revisionCreationTime.fromNow();

    // Creator info is on every tooltip, contains basic metadata.
    return (
      <div>
        Revision added:
          <b title={fullTime}>{ ` ${simpleTime} ` }</b>
          ({ timeAgo })
      </div>
    );
  }
}

export class RequestInfo extends React.PureComponent {
  static propTypes = {
    revision: PropTypes.instanceOf(Map).isRequired,
  };

  render() {
    const { revision } = this.props;

    const hasApprovalRequest = !!revision.get('approval_request');

    if (!hasApprovalRequest) {
      return null;
    }

    const requestCreator = revision.getIn(['approval_request', 'creator', 'email']);
    const requestCreationTime = moment(revision.getIn(['approval_request', 'created']));

    const fullTime = requestCreationTime.format('MMMM Do YYYY, h:mm a');
    const simpleTime = requestCreationTime.format('L');
    const timeAgo = requestCreationTime.fromNow();

    return (
      <span>
        <hr />
        Approval requested by: <b>{requestCreator}</b><br />
        Date requested:
        <b title={fullTime}>{ ` ${simpleTime} ` }</b>
        ({ timeAgo })
      </span>
    );
  }
}

export class ApprovalComment extends React.PureComponent {
  static propTypes = {
    revision: PropTypes.instanceOf(Map).isRequired,
  };

  render() {
    const { revision } = this.props;
    const isApproved = revision.getIn(['approval_request', 'approved']);
    const hasApprovalStatus = isApproved === true || isApproved === false;

    if (!hasApprovalStatus) {
      return null;
    }

    const approver = revision.getIn(['approval_request', 'approver', 'email']);

    return (
      <span>
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
      </span>
    );
  }
}
