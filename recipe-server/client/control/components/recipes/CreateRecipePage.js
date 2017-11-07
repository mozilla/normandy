import { message } from 'antd';
import autobind from 'autobind-decorator';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import { push as pushAction } from 'redux-little-router';

import handleError from 'control/utils/handleError';
import AbstractFormPage from 'control/components/recipes/AbstractFormPage';
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
export default class CreateRecipePage extends AbstractFormPage {
  static propTypes = {
    createRecipe: PropTypes.func.isRequired,
    push: PropTypes.func.isRequired,
  };

  onFailure(err) {
    handleError('Recipe cannot be created.', err);
  }

  onSuccess(newId) {
    message.success('Recipe created');
    this.props.push(`/recipe/${newId}/`);
  }

  async performAction(formValues) {
    return this.props.createRecipe(formValues);
  }

  getFormComponent() {
    return RecipeForm;
  }

  getFormProps() {
    return { isCreationForm: true };
  }

  getTitle() {
    return <h2>Create New Recipe</h2>;
  }
}
