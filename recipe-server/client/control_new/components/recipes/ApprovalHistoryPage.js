import { List } from 'immutable';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import LoadingOverlay from 'control_new/components/common/LoadingOverlay';
import QueryRecipe from 'control_new/components/data/QueryRecipe';
import QueryRecipeHistory from 'control_new/components/data/QueryRecipeHistory';
import ApprovalRequest from 'control_new/components/recipes/ApprovalRequest';
import {
  getRecipeApprovalHistory,
} from 'control_new/state/app/recipes/selectors';
import { getUrlParamAsInt } from 'control_new/state/router/selectors';


@connect(
  state => {
    const recipeId = getUrlParamAsInt(state, 'recipeId');

    return {
      history: getRecipeApprovalHistory(state, recipeId),
      recipeId,
    };
  },
)
export default class ApprovalHistoryPage extends React.Component {
  static propTypes = {
    history: PropTypes.instanceOf(List).isRequired,
    recipeId: PropTypes.number.isRequired,
  };

  render() {
    const { history, recipeId } = this.props;

    return (
      <div>
        <QueryRecipe pk={recipeId} />
        <QueryRecipeHistory pk={recipeId} />

        <LoadingOverlay requests={`fetch-recipe-history-${recipeId}`}>
          {
            history.map(revision => (
              <ApprovalRequest key={revision.get('id')} revision={revision} />
            ))
          }
        </LoadingOverlay>
      </div>
    );
  }
}
