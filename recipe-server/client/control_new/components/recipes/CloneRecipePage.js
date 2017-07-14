import { message } from 'antd';
import autobind from 'autobind-decorator';
import { Map } from 'immutable';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import { Link, push as pushAction } from 'redux-little-router';

import LoadingOverlay from 'control_new/components/common/LoadingOverlay';
import RecipeForm from 'control_new/components/recipes/RecipeForm';
import QueryRecipe from 'control_new/components/data/QueryRecipe';

import { createRecipe as createAction } from 'control_new/state/recipes/actions';
import { getRecipe } from 'control_new/state/recipes/selectors';
import { getRouterParamAsInt } from 'control_new/state/router/selectors';

@connect(
  state => {
    const recipeId = getRouterParamAsInt(state, 'recipeId');

    return {
      recipeId,
      recipe: getRecipe(state, recipeId, new Map()),
    };
  },
  {
    push: pushAction,
    createRecipe: createAction,
  },
)
@autobind
export default class CloneRecipePage extends React.Component {
  static propTypes = {
    createRecipe: PropTypes.func.isRequired,
    recipeId: PropTypes.number.isRequired,
    recipe: PropTypes.instanceOf(Map),
  };

  static defaultProps = {
    recipe: null,
  };

  state = {
    formErrors: undefined,
  };

  /**
   * Update the existing recipe and display a message.
   */
  async handleSubmit(values) {
    const { push } = this.props;

    try {
      const newId = await this.props.createRecipe(values);

      message.success('Recipe saved');
      this.setState({
        formErrors: undefined,
      });

      push(`/recipe/${newId}`);
    } catch (error) {
      message.error(
        'Recipe cannot be saved. Please correct any errors listed in the form below.',
      );

      if (error) {
        this.setState({
          formErrors: error.data || error,
        });
      }
    }
  }

  render() {
    const { recipe, recipeId } = this.props;

    const recipeName = recipe.get('name');

    // Remove the 'name' field value.
    const displayedRecipe = recipe.set('name');

    return (
      <div className="clone-page">
        <QueryRecipe pk={recipeId} />
        <LoadingOverlay useCondition condition={!recipeName}>
          <h2>New Recipe</h2>
          { recipeName &&
            <h3>
              Cloning recipe values from <Link href={`/recipe/${recipeId}`}>&quot;{ recipeName }&quot;</Link>
            </h3>
          }

          <RecipeForm
            recipe={displayedRecipe}
            onSubmit={this.handleSubmit}
            errors={this.state.formErrors}
          />
        </LoadingOverlay>
      </div>
    );
  }
}
