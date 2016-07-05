import React from 'react';
import { push } from 'react-router-redux';
import { makeApiRequest, recipeDeleted } from '../actions/ControlActions.js';
import composeRecipeContainer from './RecipeContainer.jsx';

class DeleteRecipe extends React.Component {
  deleteRecipe(event) {
    const { dispatch, recipeId } = this.props;

    event.preventDefault();
    dispatch(makeApiRequest('deleteRecipe', { recipeId }))
    .then(response => {
      dispatch(recipeDeleted(recipeId));
      dispatch(push('/control/'));
    });
  }

  render() {
    const { recipe, recipeId } = this.props;
    if (recipe) {
      return (
        <div className="fluid-7">
          <form action="" className="crud-form">
            <p>Are you sure you want to delete "{recipe.name}"?</p>
            <div className="form-action-buttons">
              <div className="fluid-2 float-right">
                <input type="submit" value="Confirm" className="delete" onClick={::this.deleteRecipe} />
              </div>
            </div>
          </form>
        </div>
      );
    } else {
      return null;
    }
  }
}

export default composeRecipeContainer(DeleteRecipe);
