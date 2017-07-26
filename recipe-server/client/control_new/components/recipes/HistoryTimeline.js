import { Icon, Tag, Timeline } from 'antd';
import { List } from 'immutable';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import { Link } from 'redux-little-router';

import { SimpleLoadingOverlay } from 'control_new/components/common/LoadingOverlay';
import QueryRecipeHistory from 'control_new/components/data/QueryRecipeHistory';
import RevisionApprovalTag from 'control_new/components/recipes/RevisionApprovalTag';
import {
  getRecipeIdForRevision as getRecipeIdForRevisionSelector,
  isLatestRevision as isLatestRevisionSelector,
} from 'control_new/state/app/revisions/selectors';


@connect(
  state => ({
    getRecipeIdForRevision: id => getRecipeIdForRevisionSelector(state, id),
    isLatestRevision: id => isLatestRevisionSelector(state, id),
  }),
)
export default class HistoryTimeline extends React.Component {
  static propTypes = {
    history: PropTypes.instanceOf(List).isRequired,
    isLatestRevision: PropTypes.func.isRequired,
    recipeId: PropTypes.number.isRequired,
    selectedRevisionId: PropTypes.string.isRequired,
  }

  render() {
    const {
      history,
      isLatestRevision,
      recipeId,
      selectedRevisionId,
    } = this.props;

    return (
      <div>
        <QueryRecipeHistory pk={recipeId} />
        <SimpleLoadingOverlay isVisible={history.size === 0}>
          <Timeline>
            {
              history.map((revision, index) => {
                const icon = <Icon type="circle-left" style={{ fontSize: '16px' }} />;

                let url = `/recipe/${recipeId}`;
                if (!isLatestRevision(revision.get('id'))) {
                  url += `/rev/${revision.get('id')}`;
                }

                return (
                  <Timeline.Item
                    color="grey"
                    dot={revision.get('id') === selectedRevisionId ? icon : null}
                    key={revision.get('id')}
                  >
                    <Link href={url}>
                      <Tag color={revision.get('id') === selectedRevisionId ? 'blue' : null}>
                        {`Revision ${history.size - index}`}
                      </Tag>
                    </Link>

                    <RevisionApprovalTag revision={revision} />
                  </Timeline.Item>
                );
              }).toArray()
            }
          </Timeline>
        </SimpleLoadingOverlay>
      </div>
    );
  }
}
