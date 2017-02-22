import React, { PropTypes as pt } from 'react';
import { connect } from 'react-redux';
import { makeApiRequest, singleRecipeReceived, setSelectedRecipe }
  from 'control/actions/ControlActions';

export default function composeRecipeContainer(Component) {
  class RecipeContainer extends React.Component {
    static propTypes = {
      dispatch: pt.func.isRequired,
      location: pt.object.isRequired,
      recipe: pt.object.isRequired,
      routeParams: pt.object,
    }

    componentWillMount() {
      if (this.props.recipeId) {
        this.getRecipeData(this.props.recipeId);
      }
    }

    componentWillReceiveProps({ recipeId, routeParams: { revisionId } }) {
      const gettingNewRecipe = recipeId && recipeId !== this.props.recipeId;
      const gettingNewRevision = revisionId && revisionId !== this.props.routeParams.revisionId;

      if (gettingNewRecipe || gettingNewRevision) {
        this.getRecipeData(recipeId, revisionId);
      }
    }

    getRecipeData(recipeId, requestedRevision) {
      const { dispatch, routeParams, recipe } = this.props;
      if (!recipe) {
        dispatch(setSelectedRecipe(recipeId));

        const revisionId = requestedRevision || routeParams.revisionId;

        if (revisionId) {
          // request the data for the selected revision
          dispatch(makeApiRequest('fetchSingleRevision', { revisionId }))
          .then(revision => {
            // once we have the revision, we have the recipe id, and we need to
            // load the single recipe data in order to determine the latest revision id
            dispatch(makeApiRequest('fetchSingleRecipe', { recipeId: revision.recipe.id }))
            .then(({ latest_revision_id }) => {
              // once we get the 'latest' revision id,
              // pass through the selected revision with the patched value
              dispatch(singleRecipeReceived({
                ...revision.recipe,
                latest_revision_id,
              }));
            });
          });
        } else {
          dispatch(makeApiRequest('fetchSingleRecipe', { recipeId }))
          .then(newRecipe => {
            dispatch(singleRecipeReceived({
              ...newRecipe,
            }));
          });
        }
      }
    }

    render() {
      return <Component {...this.props} {...this.state} isRecipeContainer />;
    }
  }

  const mapStateToProps = (state, props) => {
    let recipeData = null;
    if (state.recipes && state.recipes.list.length) {
      recipeData = state.recipes.list
        .find(recipe => recipe.id === state.recipes.selectedRecipe);
    }

    return {
      recipeId: state.recipes.selectedRecipe || parseInt(props.params.id, 10) || null,
      recipe: recipeData,
      dispatch: props.dispatch,
    };
  };

  RecipeContainer.propTypes = {
    recipeId: React.PropTypes.number,
    recipe: React.PropTypes.object,
    dispatch: React.PropTypes.func,
  };

  return connect(
    mapStateToProps
  )(RecipeContainer);
}
