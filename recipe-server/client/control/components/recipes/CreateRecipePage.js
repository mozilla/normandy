import { message } from 'antd';
import autobind from 'autobind-decorator';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import { push as pushAction } from 'redux-little-router';

import handleError from 'control/utils/handleError';
import RecipeForm from 'control/components/recipes/RecipeForm';
import { createRecipe as createAction } from 'control/state/app/recipes/actions';


@connect(
  null,
  {
    createRecipe: createAction,
    push: pushAction,
  },
)
@autobind
export default class CreateRecipePage extends React.PureComponent {
  static propTypes = {
    createRecipe: PropTypes.func.isRequired,
    push: PropTypes.func.isRequired,
  };

  state = {
    formErrors: undefined,
  };

  /**
   * Update the existing recipe and display a message.
   */
  async handleSubmit(values) {
    const {
      createRecipe,
      push,
    } = this.props;

    this.setState({
      formErrors: undefined,
    });

    try {
      const newId = await createRecipe(values);
      message.success('Recipe created');
      push(`/recipe/${newId}/`);
    } catch (error) {
      handleError('Recipe cannot be created.', error);

      this.setState({
        formErrors: error.data || error,
      });
    }
  }

  render() {
    return (
      <div>
        <h2>Create New Recipe</h2>
        <RecipeForm
          onSubmit={this.handleSubmit}
          errors={this.state.formErrors}
          isCreationForm
        />
      </div>
    );
  }
}
