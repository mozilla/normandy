import React, { PropTypes as pt } from 'react';
import { connect } from 'react-redux';
import { makeApiRequest, singleRecipeReceived, setSelectedRecipe }
  from '../actions/ControlActions.js';

export default function composeRecipeContainer(Component) {
  class RecipeContainer extends React.Component {
    propTypes = {
      dispatch: pt.func.isRequired,
      location: pt.object.isRequired,
      recipe: pt.object.isRequired,
    }

    componentWillMount() {
      if (this.props.recipeId) {
        this.getRecipeData(this.props.recipeId);
      }
    }

    getRecipeData(recipeId) {
      const { dispatch, location, recipe } = this.props;
      if (!recipe) {
        dispatch(setSelectedRecipe(recipeId));

        if (location.query.revisionId) {
          dispatch(makeApiRequest('fetchSingleRevision', { revisionId: location.query.revisionId }))
          .then(revision => {
            dispatch(singleRecipeReceived(revision.recipe));
          });
        } else {
          dispatch(makeApiRequest('fetchSingleRecipe', { recipeId }))
          .then(newRecipe => {
            dispatch(singleRecipeReceived(newRecipe));
          });
        }
      }
    }

    render() {
      return <Component {...this.props} {...this.state} />;
    }
  }

  const mapStateToProps = (state, props) => {
    let recipeData = null;
    if (state.controlApp.recipes) {
      recipeData = state.controlApp.recipes
      .find(recipe => recipe.id === state.controlApp.selectedRecipe);
    }

    return {
      recipeId: state.controlApp.selectedRecipe || parseInt(props.params.id, 10) || null,
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
