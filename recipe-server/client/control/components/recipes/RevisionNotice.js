import { Alert } from 'antd';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import {
  REVISION_DRAFT,
  REVISION_OUTDATED,
} from 'control/state/constants';
import {
  isRevisionPendingApproval,
  getRevisionDraftStatus,
} from 'control/state/app/revisions/selectors';


@connect(
  (state, { revision }) => ({
    enabled: revision.getIn(['recipe', 'enabled'], false),
    isPendingApproval: isRevisionPendingApproval(state, revision.get('id')),
    status: getRevisionDraftStatus(state, revision.get('id')),
  }),
)
export default class RevisionNotice extends React.PureComponent {
  static propTypes = {
    enabled: PropTypes.bool.isRequired,
    isPendingApproval: PropTypes.bool.isRequired,
    status: PropTypes.string,
  };

  static defaultProps = {
    status: null,
  }

  render() {
    const { enabled, isPendingApproval, status } = this.props;

    let message;
    let type;

    if (isPendingApproval) {
      message = 'This is pending approval.';
      type = 'warning';
    } else if (status === REVISION_DRAFT) {
      message = 'You are viewing a draft.';
      type = 'info';
    } else if (status === REVISION_OUTDATED) {
      message = 'You are viewing an outdated version.';
      type = 'info';
    } else if (enabled) {
      message = 'This is the published version.';
      type = 'success';
    } else {
      return null;
    }

    return (
      <Alert
        className="revision-notice"
        type={type}
        message={message}
        showIcon
      />
    );
  }
}
