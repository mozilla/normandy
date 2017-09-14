import React, { PropTypes as pt } from 'react';
import { push } from 'react-router-redux';

import makeApiRequest from 'control_old/api';
import { singleRecipeReceived } from 'control_old/actions/RecipeActions';
import composeRecipeContainer from 'control_old/components/RecipeContainer';

class DisableRecipe extends React.Component {
  static propTypes = {
    dispatch: pt.func.isRequired,
    recipeId: pt.number.isRequired,
    recipe: pt.object,
  }

  constructor(props) {
    super(props);
    this.disableRecipe = ::this.disableRecipe;
  }

  disableRecipe(event) {
    const { dispatch, recipe, recipeId } = this.props;

    event.preventDefault();
    dispatch(makeApiRequest('disableRecipe', { recipeId }))
    .then(() => {
      dispatch(singleRecipeReceived(recipe));
      dispatch(push(`/control_old/recipe/${recipeId}/`));
    });
  }

  render() {
    const { recipe } = this.props;

    if (!recipe) { return null; }

    return (
      <div className="fluid-8">
        <form action="" className="crud-form">
          <p>Are you sure you want to disable &quote;{recipe.name}&quote;?</p>
          <div className="form-action-buttons">
            <div className="fluid-2 float-right">
              <input
                type="submit"
                value="Confirm"
                className="delete"
                onClick={this.disableRecipe}
              />
            </div>
          </div>
        </form>
      </div>
    );
  }
}

export default composeRecipeContainer(DisableRecipe);
