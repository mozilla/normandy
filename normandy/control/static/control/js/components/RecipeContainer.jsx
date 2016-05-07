import React from 'react'
import { connect } from 'react-redux'
import { push } from 'react-router-redux'
import ControlActions from '../actions/ControlActions.js'

export default function composeRecipeContainer(Component) {

  class RecipeContainer extends React.Component {
    constructor(props) {
      super(props);
      this.getRecipeData = this.getRecipeData.bind(this);
    }

    getRecipeData(recipeId) {
      const { dispatch } = this.props;
      if (!this.props.recipes) {
        dispatch(ControlActions.setSelectedRecipe(recipeId));
        dispatch(ControlActions.makeApiRequest('fetchSingleRecipe', { recipeId: recipeId }));
      }
    }

    componentWillMount() {
      if (this.props.recipeId) {
        this.getRecipeData(this.props.recipeId);
      }
    }

    render() {
     return <Component {...this.props} {...this.state} />
    }
  }

  const mapStateToProps = (state, props) => {
    let recipeData = null;
    if (state.controlApp.recipes) {
      recipeData = state.controlApp.recipes.find(recipe => {
        return recipe.id === state.controlApp.selectedRecipe;
      });
    }

    return {
      recipeId: state.controlApp.selectedRecipe || parseInt(props.routeParams.id) || null,
      recipe: recipeData,
      dispatch: props.dispatch
    };
  }

  RecipeContainer.propTypes = {
    recipeId: React.PropTypes.number,
    recipe: React.PropTypes.object,
    dispatch: React.PropTypes.func
  }

  return connect(
    mapStateToProps
  )(RecipeContainer)

}
