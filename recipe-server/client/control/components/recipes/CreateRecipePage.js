import { message } from 'antd';
import autobind from 'autobind-decorator';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import { push as pushAction } from 'redux-little-router';

import handleError from 'control/utils/handleError';
import AbstractRecipePage from 'control/components/recipes/AbstractRecipePage';

import { createRecipe as createAction } from 'control/state/app/recipes/actions';


@connect(
  null,
  {
    createRecipe: createAction,
    push: pushAction,
  },
)
@autobind
export default class CreateRecipePage extends AbstractRecipePage {
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
    return await this.props.createRecipe(formValues);
  }

  getFormProps() {
    return { isCreationForm: true, };
  }

  getTitle() {
    return <h2>Create New Recipe</h2>;
  }
}
