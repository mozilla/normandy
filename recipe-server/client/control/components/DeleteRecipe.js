import React, { PropTypes as pt } from 'react';
import { push } from 'react-router-redux';

import makeApiRequest from 'control/api';
import { recipeDeleted } from 'control/actions/RecipeActions';
import composeRecipeContainer from 'control/components/RecipeContainer';

class DeleteRecipe extends React.Component {
  propTypes = {
    dispatch: pt.func.isRequired,
    recipeId: pt.number.isRequired,
    recipe: pt.object.isRequired,
  }

  constructor(props) {
    super(props);
    this.deleteRecipe = ::this.deleteRecipe;
  }

  deleteRecipe(event) {
    const { dispatch, recipeId } = this.props;

    event.preventDefault();
    dispatch(makeApiRequest('deleteRecipe', { recipeId }))
    .then(() => {
      dispatch(recipeDeleted(recipeId));
      dispatch(push('/control/'));
    });
  }

  render() {
    const { recipe } = this.props;
    if (recipe) {
      return (
        <div className="fluid-7">
          <form action="" className="crud-form">
            <p>Are you sure you want to delete &quote;{recipe.name}&quote;?</p>
            <div className="form-action-buttons">
              <div className="fluid-2 float-right">
                <input
                  type="submit"
                  value="Confirm"
                  className="delete"
                  onClick={this.deleteRecipe}
                />
              </div>
            </div>
          </form>
        </div>
      );
    }

    return null;
  }
}

export default composeRecipeContainer(DeleteRecipe);
