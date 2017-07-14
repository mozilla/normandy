import { message } from 'antd';
import autobind from 'autobind-decorator';
import { Map } from 'immutable';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import { SimpleLoadingOverlay } from 'control_new/components/common/LoadingOverlay';
import RecipeForm from 'control_new/components/recipes/RecipeForm';
import QueryRecipe from 'control_new/components/data/QueryRecipe';

import { updateRecipe } from 'control_new/state/recipes/actions';
import { getRecipe } from 'control_new/state/recipes/selectors';
import { getUrlParamAsInt } from 'control_new/state/router/selectors';


@connect(
  state => {
    const recipeId = getUrlParamAsInt(state, 'recipeId');

    return {
      recipeId,
      recipe: getRecipe(state, recipeId, new Map()),
    };
  },
  {
    updateRecipe,
  },
)
@autobind
export default class EditRecipePage extends React.Component {
  static propTypes = {
    updateRecipe: PropTypes.func.isRequired,
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
    const { recipeId } = this.props;

    try {
      await this.props.updateRecipe(recipeId, values);
      message.success('Recipe saved');
      this.setState({
        formErrors: undefined,
      });
    } catch (error) {
      message.error(
        'Recipe cannot be saved. Please correct any errors listed in the form below.',
      );

      if (error && error.data) {
        this.setState({
          formErrors: error.data,
        });
      }
    }
  }

  render() {
    const { recipe, recipeId } = this.props;

    return (
      <div>
        <QueryRecipe pk={recipeId} />
        <SimpleLoadingOverlay condition={!recipe.get('name')}>
          <h2>Edit Recipe</h2>
          <RecipeForm
            recipe={recipe}
            onSubmit={this.handleSubmit}
            errors={this.state.formErrors}
          />
        </SimpleLoadingOverlay>
      </div>
    );
  }
}
