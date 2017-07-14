import { message } from 'antd';
import autobind from 'autobind-decorator';
import pt from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import { push as pushAction } from 'redux-little-router';

import RecipeForm from 'control_new/components/recipes/RecipeForm';
import { createRecipe as createAction } from 'control_new/state/recipes/actions';


@connect(
  null,
  {
    createRecipe: createAction,
    push: pushAction,
  },
)
@autobind
export default class CreateRecipePage extends React.Component {
  static propTypes = {
    createRecipe: pt.func.isRequired,
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


    try {
      const newId = await createRecipe(values);
      message.success('Recipe created');
      this.setState({
        formErrors: undefined,
      });
      push(`/recipe/${newId}`);
    } catch (error) {
      message.error(
        'Recipe cannot be created. Please correct any errors listed in the form below.',
      );

      if (error) {
        this.setState({
          formErrors: error.data || error,
        });
      }
    }
  }

  render() {
    return (
      <div>
        <h2>Create New Recipe</h2>
        <RecipeForm
          onSubmit={this.handleSubmit}
          errors={this.state.formErrors}
        />
      </div>
    );
  }
}
