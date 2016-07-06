import React, { PropTypes as pt } from 'react';
import { push } from 'react-router-redux';
import moment from 'moment';
import composeRecipeContainer from './RecipeContainer.jsx';
import { makeApiRequest } from '../actions/ControlActions.js';

class RecipeHistory extends React.Component {
  propTypes = {
    dispatch: pt.func.isRequired,
    recipe: pt.object.isRequired,
    recipeId: pt.number.isRequired,
  }

  constructor(props) {
    super(props);
    this.state = {
      revisionLog: [],
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
        revisionLog: history,
      });
    });
  }

  render() {
    const { recipe, dispatch } = this.props;
    return (
      <div className="fluid-8 recipe-history">
        <h3>Viewing revision log for: <b>{recipe ? recipe.name : ''}</b></h3>
        <ul>
            {this.state.revisionLog.map(revision =>
              <HistoryItem
                key={revision.id}
                revision={revision}
                recipe={recipe}
                dispatch={dispatch}
              />
            )}
        </ul>
      </div>
    );
  }
}

class HistoryItem extends React.Component {
  static propTypes = {
    dispatch: pt.func.isRequired,
    revision: pt.shape({
      recipe: pt.shape({
        revision_id: pt.number.isRequired,
      }).isRequired,
      date_created: pt.string.isRequired,
    }).isRequired,
    recipe: pt.shape({
      revision_id: pt.number.isRequired,
    }).isRequired,
  }

  /**
   * When a revision is clicked, open the recipe form with changes from
   * the clicked revision.
   */
  handleClick() {
    const { dispatch, revision, recipe } = this.props;

    // Do not include form state changes if the current revision was
    // clicked.
    if (revision.recipe.revision_id === recipe.revision_id) {
      dispatch(push(`/control/recipe/${recipe.id}/`));
    } else {
      dispatch(push({
        pathname: `/control/recipe/${recipe.id}/`,
        query: { revisionId: `${revision.id}` },
        state: { selectedRevision: revision.recipe },
      }));
    }
  }

  render() {
    const { revision, recipe } = this.props;
    const isCurrent = revision.recipe.revision_id === recipe.revision_id;

    return (
      <li className="history-item" onClick={::this.handleClick}>
        <p className="revision-number">#{revision.recipe.revision_id}</p>
        <p className="revision-created">
          <span className="label">Created On:</span>
          {moment(revision.date_created).format('MMM Do YYYY - h:mmA')}
        </p>
        {isCurrent && (
          <div className="revision-status status-indicator green">
            <i className="fa fa-circle pre" />
            Current Revision
          </div>
        )}
      </li>
    );
  }
}

export default composeRecipeContainer(RecipeHistory);
