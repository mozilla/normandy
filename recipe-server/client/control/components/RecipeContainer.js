import React, { PropTypes as pt } from 'react';
import { connect } from 'react-redux';

import makeApiRequest from 'control/api';
import {
  singleRecipeReceived,
  setSelectedRecipe,
  setSelectedRevision,
  revisionsReceived,
} from 'control/actions/RecipeActions';

import {
  getSelectedRevision,
} from 'control/selectors/RecipesSelector';

export class RecipeContainer extends React.Component {
  static propTypes = {
    dispatch: pt.func.isRequired,
    recipe: pt.object.isRequired,
    routeParams: pt.object.isRequired,
  }

  componentWillMount() {
    if (this.props.recipeId) {
      this.getRecipeData(this.props.recipeId, this.props.routeParams.revisionId);
    }
  }

  componentWillReceiveProps({ recipeId, routeParams = {} }) {
    const isRecipeChanging = recipeId !== this.props.recipeId;
    const isRouteRevisionChanging =
      routeParams.revisionId !== this.props.routeParams.revisionId;

    if (isRecipeChanging || isRouteRevisionChanging) {
      this.getRecipeData(recipeId, routeParams && routeParams.revisionId);
    }

    if (isRouteRevisionChanging) {
      this.props.dispatch(setSelectedRevision(routeParams.revisionId));
    }
  }

  getRecipeData(recipeId, revisionId) {
    const { dispatch } = this.props;
    if (!recipeId) {
      return;
    }

    dispatch(setSelectedRecipe(recipeId));
    dispatch(setSelectedRevision(revisionId));

    dispatch(makeApiRequest('fetchSingleRecipe', { recipeId }))
      .then(newRecipe => {
        dispatch(singleRecipeReceived(newRecipe));

        this.getRecipeHistory(recipeId, revisionId || newRecipe.revision_id);
      });
  }

  getRecipeHistory(recipeId, revisionId) {
    const { dispatch } = this.props;

    dispatch(makeApiRequest('fetchRecipeHistory', { recipeId }))
      .then(revisions => {
        dispatch(setSelectedRevision(revisionId));

        dispatch(revisionsReceived({
          recipeId,
          revisions,
        }));
      });
  }

  render() {
    return null;
  }
}
RecipeContainer.propTypes = {
  recipeId: React.PropTypes.number,
  recipe: React.PropTypes.object,
  dispatch: React.PropTypes.func,
};

export default function composeRecipeContainer(Component) {
  class ComposedRecipeContainer extends RecipeContainer {
    render() {
      return <Component {...this.props} {...this.state} />;
    }
  }

  const mapStateToProps = (state, props) => ({
    dispatch: props.dispatch,
    recipeId: state.recipes.selectedRecipe || parseInt(props.params.id, 10) || null,
      // Get selected recipe + revision data
    ...getSelectedRevision(state),
  });

  ComposedRecipeContainer.propTypes = { ...RecipeContainer.propTypes };

  return connect(
    mapStateToProps
  )(ComposedRecipeContainer);
}
