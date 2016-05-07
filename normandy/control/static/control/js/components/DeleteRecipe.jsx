import React from 'react'
import { push } from 'react-router-redux'
import ControlActions from '../actions/ControlActions.js'
import composeRecipeContainer from './RecipeContainer.jsx'

class DeleteRecipe extends React.Component {
  render() {
    const { recipe, recipeId, dispatch } = this.props;
    if (recipe) {
      return (
        <div className="fluid-7">
          <form action="" className="crud-form">
            <p>Are you sure you want to delete "{recipe.name}"?</p>
            <div className="form-action-buttons">
              <div className="fluid-2 float-right">
                <input type="submit" value="Confirm" class="delete" onClick={(e) => {
                  dispatch(ControlActions.makeApiRequest('deleteRecipe', { recipeId }));
                  dispatch(push(`/control/`));
                }} />
              </div>
            </div>
          </form>
        </div>
      )
    } else {
      return null
    }
  }
}

export default composeRecipeContainer(DeleteRecipe);
