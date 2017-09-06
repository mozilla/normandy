import { Icon, Tag, Timeline } from 'antd';
import autobind from 'autobind-decorator';
import { List } from 'immutable';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import { Link } from 'redux-little-router';

import LoadingOverlay from 'control/components/common/LoadingOverlay';
import QueryRecipeHistory from 'control/components/data/QueryRecipeHistory';
import RevisionApprovalTag from 'control/components/recipes/RevisionApprovalTag';
import {
  getRecipeIdForRevision as getRecipeIdForRevisionSelector,
  isLatestRevision as isLatestRevisionSelector,
} from 'control/state/app/revisions/selectors';


@connect(
  state => ({
    getRecipeIdForRevision: id => getRecipeIdForRevisionSelector(state, id),
    isLatestRevision: id => isLatestRevisionSelector(state, id),
  }),
)
@autobind
export default class HistoryTimeline extends React.PureComponent {
  static propTypes = {
    history: PropTypes.instanceOf(List).isRequired,
    isLatestRevision: PropTypes.func.isRequired,
    recipeId: PropTypes.number.isRequired,
    selectedRevisionId: PropTypes.string.isRequired,
  }

  getRevisionStyles(revision) {
    const approvalRequest = revision.get('approval_request');

    let iconType;
    let color;

    if (revision.get('id') === this.props.selectedRevisionId) {
      color = 'blue';
      iconType = 'circle-left';
    } else if (approvalRequest && approvalRequest.get('approved') === null) {
        // pending
      color = 'yellow';
      iconType = 'clock-circle-o';
    } else if (approvalRequest && approvalRequest.get('approved')) {
        // approved
      color = 'green';
      iconType = 'check-circle';
    } else if (approvalRequest && !approvalRequest.get('approved')) {
        // rejected
      color = 'red';
      iconType = 'close-circle';
    }

    color = color || 'grey';

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
    };
  }

  render() {
    const {
      history,
      isLatestRevision,
      recipeId,
    } = this.props;

    return (
      <div>
        <QueryRecipeHistory pk={recipeId} />
        <LoadingOverlay requestIds={`fetch-recipe-history-${recipeId}`}>
          <Timeline>
            {
              history.map((revision, index) => {
                let url = `/recipe/${recipeId}`;
                if (!isLatestRevision(revision.get('id'))) {
                  url += `/rev/${revision.get('id')}`;
                }

                const { icon, color } = this.getRevisionStyles(revision);

                return (
                  <Timeline.Item
                    color={color}
                    dot={icon}
                    key={revision.get('id')}
                  >
                    <Link href={url}>
                      <Tag color={icon && color}>
                        {`Revision ${history.size - index}`}
                      </Tag>
                    </Link>

                    <RevisionApprovalTag revision={revision} />
                  </Timeline.Item>
                );
              }).toArray()
            }
          </Timeline>
        </LoadingOverlay>
      </div>
    );
  }
}
