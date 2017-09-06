import { Card, Col, Row } from 'antd';
import { List, Map } from 'immutable';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import LoadingOverlay from 'control_new/components/common/LoadingOverlay';
import QueryRecipe from 'control_new/components/data/QueryRecipe';
import DetailsActionBar from 'control_new/components/recipes/DetailsActionBar';
import RecipeDetails from 'control_new/components/recipes/RecipeDetails';
import HistoryTimeline from 'control_new/components/recipes/HistoryTimeline';
import RevisionNotice from 'control_new/components/recipes/RevisionNotice';
import {
  getLatestRevisionIdForRecipe,
  getRecipeHistory,
} from 'control_new/state/app/recipes/selectors';
import { getRevision } from 'control_new/state/app/revisions/selectors';
import { getUrlParam, getUrlParamAsInt } from 'control_new/state/router/selectors';


@connect(
  state => {
    const recipeId = getUrlParamAsInt(state, 'recipeId');
    const latestRevisionId = getLatestRevisionIdForRecipe(state, recipeId, '');
    const revisionId = getUrlParam(state, 'revisionId', latestRevisionId);
    const revision = getRevision(state, revisionId, new Map());

    return {
      history: getRecipeHistory(state, recipeId, new List()),
      recipeId,
      revision,
      revisionId,
    };
  },
)
export default class RecipeDetailPage extends React.PureComponent {
  static propTypes = {
    history: PropTypes.instanceOf(List).isRequired,
    recipeId: PropTypes.number.isRequired,
    revision: PropTypes.instanceOf(Map).isRequired,
    revisionId: PropTypes.string.isRequired,
  }

  render() {
    const { history, recipeId, revision, revisionId } = this.props;
    return (
      <div className="page-recipe-details">
        <QueryRecipe pk={recipeId} />
        <Row gutter={24}>
          <Col span={16}>
            <DetailsActionBar />
            <RevisionNotice revision={revision} />
            <LoadingOverlay requestIds={[`fetch-recipe-${recipeId}`, `fetch-revision-${revisionId}`]}>
              <RecipeDetails recipe={revision.get('recipe', new Map())} />
            </LoadingOverlay>
          </Col>
          <Col span={8} className="recipe-history">
            <Card className="noHovering" title="History">
              <HistoryTimeline
                history={history}
                recipeId={recipeId}
                selectedRevisionId={revisionId}
              />
            </Card>
          </Col>
        </Row>
      </div>
    );
  }
}
