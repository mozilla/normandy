import { Tag, Timeline } from 'antd';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import { Link } from 'redux-little-router';

import RevisionApprovalTag from 'control_new/components/recipes/RevisionApprovalTag';
import * as revisionsSelectors from 'control_new/state/revisions/selectors';


@connect(
  state => ({
    getRecipeIdForRevision: id => revisionsSelectors.getRecipeIdForRevision(state, id),
    isLatestRevision: id => revisionsSelectors.isLatestRevision(state, id),
  }),
)
export default class HistoryTimeline extends React.Component {
  static propTypes = {
    getRecipeIdForRevision: PropTypes.func.isRequired,
    history: PropTypes.object,
    isLatestRevision: PropTypes.func.isRequired,
    selectedRevisionId: PropTypes.string,
  }

  render() {
    const {
      getRecipeIdForRevision,
      history,
      isLatestRevision,
      selectedRevisionId,
    } = this.props;

    return (
      <Timeline>
        {
          history.map((revision, index) => {
            const recipeId = getRecipeIdForRevision(revision.get('id'));

            let url = `/recipes/${recipeId}`;
            if (!isLatestRevision(revision.get('id'))) {
              url += `/rev/${revision.get('id')}`;
            }

            return (
              <Timeline.Item color="grey" key={revision.get('id')}>
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
    );
  }
}
