import React, { PropTypes as pt } from 'react';
import { push } from 'react-router-redux';
import moment from 'moment';

import composeRecipeContainer from 'control/components/RecipeContainer';
import DraftStatus from 'control/components/DraftStatus';

import { makeApiRequest } from 'control/actions/ControlActions';
import {
  getLastApprovedRevision,
} from 'control/selectors/RecipesSelector';

export class DisconnectedRecipeHistory extends React.Component {
  static propTypes = {
    dispatch: pt.func.isRequired,
    recipe: pt.object.isRequired,
    recipeId: pt.number.isRequired,
  }

  constructor(props) {
    super(props);
    this.state = {
      revisions: [],
    };
  }

  componentDidMount() {
    const { recipeId } = this.props;
    this.getHistory(recipeId);
  }

  getHistory(recipeId) {
    const { dispatch } = this.props;

    dispatch(makeApiRequest('fetchRecipeHistory', { recipeId }))
    .then(history => {
      this.setState({
        revisions: history,
      });
    });
  }

  render() {
    const { recipe, dispatch } = this.props;
    const { revisions } = this.state;
    return <HistoryList recipe={recipe} dispatch={dispatch} revisions={revisions} />;
  }
}

export function HistoryList({ recipe, revisions, dispatch }) {
  const lastApprovedId = getLastApprovedRevision(revisions).id;

  return (
    <div className="fluid-8 recipe-history">
      <h3>Viewing revision log for: <b>{recipe ? recipe.name : ''}</b></h3>
      <table>
        <tbody>
          {revisions.map(revision =>
            <HistoryItem
              key={revision.id}
              revision={revision}
              recipe={recipe}
              dispatch={dispatch}
              approvedId={lastApprovedId}
            />
          )}
        </tbody>
      </table>
    </div>
  );
}
HistoryList.propTypes = {
  dispatch: pt.func.isRequired,
  recipe: pt.object.isRequired,
  revisions: pt.arrayOf(pt.object).isRequired,
};

export class HistoryItem extends React.Component {
  static propTypes = {
    dispatch: pt.func.isRequired,
    revision: pt.shape({
      recipe: pt.shape({
        revision_id: pt.number.isRequired,
      }).isRequired,
      date_created: pt.string.isRequired,
      comment: pt.string.isRequired,
    }).isRequired,
    recipe: pt.shape({
      revision_id: pt.number.isRequired,
    }).isRequired,
    approvedId: pt.string,
  }

  constructor(props) {
    super(props);
    this.handleClick = ::this.handleClick;
  }

  /**
   * When a revision is clicked, open the recipe form with changes from
   * the clicked revision.
   */
  handleClick() {
    const { dispatch, revision, recipe } = this.props;

    // Do not include form state changes if the current revision was
    // clicked.
    if (revision.recipe.revision_id === recipe.latest_revision_id) {
      dispatch(push(`/control/recipe/${recipe.id}/`));
    } else {
      dispatch(push(`/control/recipe/${recipe.id}/revision/${revision.id}/`));
    }
  }

  render() {
    const { revision, recipe, approvedId } = this.props;

    return (
      <tr className="history-item" onClick={this.handleClick}>
        <td className="revision-number">{revision.recipe.revision_id}</td>
        <td className="revision-created">
          <span className="label">Created On:</span>
          {moment(revision.date_created).format('MMM Do YYYY - h:mmA')}
        </td>
        <td className="revision-comment">
        {
          !!revision.comment &&
            <span>
              <span className="label">Comment:</span>
              <span className="comment-text">{revision.comment || '--'}</span>
            </span>
        }
        </td>
        <td>
          <DraftStatus
            latestRevisionId={recipe.latest_revision_id}
            lastApprovedRevisionId={approvedId}
            recipe={revision.recipe}
          />
        </td>
      </tr>
    );
  }
}

export default composeRecipeContainer(DisconnectedRecipeHistory);
