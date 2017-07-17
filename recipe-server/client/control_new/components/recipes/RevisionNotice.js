import { Alert } from 'antd';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import {
  REVISION_DRAFT,
  REVISION_OUTDATED,
} from 'control_new/state/constants';
import {
  getRevisionDraftStatus,
} from 'control_new/state/revisions/selectors';


@connect(
  (state, { revision }) => ({
    status: getRevisionDraftStatus(state, revision.get('id')),
  }),
)
export default class RevisionNotice extends React.Component {
  static propTypes = {
    status: PropTypes.string,
  };

  static defaultProps = {
    status: null,
  }

  render() {
    const { status } = this.props;

    let message;

    if (status === REVISION_DRAFT) {
      message = 'You are viewing a draft.';
    } else if (status === REVISION_OUTDATED) {
      message = 'You are viewing an outdated version.';
    } else {
      return (
        <Alert
          className="revision-notice"
          type="success"
          message="This is the published version."
          showIcon
        />
      );
    }

    return (
      <Alert
        className="revision-notice"
        type="warning"
        message={message}
        showIcon
      />
    );
  }
}
