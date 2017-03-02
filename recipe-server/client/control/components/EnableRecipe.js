import React, { PropTypes as pt } from 'react';
import { push } from 'react-router-redux';
import { makeApiRequest, singleRecipeReceived } from 'control/actions/ControlActions';
import composeRecipeContainer from 'control/components/RecipeContainer';

class EnableRecipe extends React.Component {
  static propTypes = {
    dispatch: pt.func.isRequired,
    recipeId: pt.number.isRequired,
    recipe: pt.object,
  }

  constructor(props) {
    super(props);
    this.enableRecipe = ::this.enableRecipe;
  }

  enableRecipe(event) {
    const { dispatch, recipeId } = this.props;

    event.preventDefault();
    dispatch(makeApiRequest('enableRecipe', { recipeId }))
    .then(() => {
      dispatch(singleRecipeReceived(recipeId));
      dispatch(push(`/control/recipe/${recipeId}/`));
    });
  }

  render() {
    const { recipe } = this.props;

    if (!recipe) { return null; }

    return (
      <div className="fluid-8">
        <form action="" className="crud-form">
          <p>Are you sure you want to enable "{recipe.name}"?</p>
          <div className="form-action-buttons">
            <div className="fluid-2 float-right">
              <input
                type="submit"
                value="Confirm"
                className="submit"
                onClick={this.enableRecipe}
              />
            </div>
          </div>
        </form>
      </div>
    );
  }
}

export default composeRecipeContainer(EnableRecipe);
