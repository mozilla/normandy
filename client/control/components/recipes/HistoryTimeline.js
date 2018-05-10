import { Timeline } from 'antd';
import autobind from 'autobind-decorator';
import { List } from 'immutable';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import HistoryItem from 'control/components/recipes/HistoryItem';

import LoadingOverlay from 'control/components/common/LoadingOverlay';
import QueryRecipeHistory from 'control/components/data/QueryRecipeHistory';
import {
  getRecipeIdForRevision as getRecipeIdForRevisionSelector,
} from 'control/state/app/revisions/selectors';

@connect(
  state => ({
    getRecipeIdForRevision: id => getRecipeIdForRevisionSelector(state, id),
  }),
)
@autobind
export default class HistoryTimeline extends React.PureComponent {
  static propTypes = {
    history: PropTypes.instanceOf(List).isRequired,
    recipeId: PropTypes.number.isRequired,
    selectedRevisionId: PropTypes.number.isRequired,
  }

  render() {
    const {
      history,
      recipeId,
      selectedRevisionId,
    } = this.props;

    return (
      <div>
        <QueryRecipeHistory pk={recipeId} />
        <LoadingOverlay requestIds={`fetch-recipe-history-${recipeId}`}>
          <Timeline>
            {
              history.map((revision, index) =>
                (<HistoryItem
                  key={revision.get('id')}
                  selectedRevisionId={selectedRevisionId}
                  revisionNo={history.size - index}
                  recipeId={recipeId}
                  revision={revision}
                />),
              )
            }
          </Timeline>
        </LoadingOverlay>
      </div>
    );
  }
}
