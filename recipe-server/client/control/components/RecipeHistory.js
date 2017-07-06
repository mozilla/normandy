import React, { PropTypes as pt } from 'react';
import { push } from 'react-router-redux';
import moment from 'moment';

import composeRecipeContainer from 'control/components/RecipeContainer';
import makeApiRequest from 'control/api';
import DraftStatus from 'control/components/DraftStatus';

import {
  getLastApprovedRevision,
} from 'control/selectors/RecipesSelector';

export class DisconnectedRecipeHistory extends React.Component {
  static propTypes = {
    dispatch: pt.func.isRequired,
    recipeId: pt.number.isRequired,
    recipe: pt.object,
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
            (<HistoryItem
              key={revision.id}
              revision={revision}
              recipe={recipe}
              dispatch={dispatch}
              approvedId={lastApprovedId}
            />),
          )}
        </tbody>
      </table>
    </div>
  );
}
HistoryList.propTypes = {
  dispatch: pt.func.isRequired,
  revisions: pt.arrayOf(pt.object).isRequired,
  recipe: pt.object,
};

export class HistoryItem extends React.Component {
  static propTypes = {
    dispatch: pt.func.isRequired,
    revision: pt.shape({
      recipe: pt.shape({
        revision_id: pt.string.isRequired,
      }).isRequired,
      date_created: pt.string.isRequired,
      comment: pt.string.isRequired,
    }).isRequired,
    recipe: pt.shape({
      revision_id: pt.string.isRequired,
    }),
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
    dispatch(push(`/control/recipe/${recipe.id}/revision/${revision.id}/`));
  }

  render() {
    const {
      revision,
      recipe,
      approvedId,
    } = this.props;

    return (
      <tr className="history-item" onClick={this.handleClick}>
        <td className="revision-number">
          {revision && revision.recipe && revision.recipe.revision_id}
        </td>
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
            latestRevisionId={recipe && recipe.latest_revision_id}
            lastApprovedRevisionId={approvedId}
            recipe={revision.recipe}
          />
        </td>
      </tr>
    );
  }
}

export default composeRecipeContainer(DisconnectedRecipeHistory);
