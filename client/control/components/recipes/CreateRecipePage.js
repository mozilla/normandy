import { message } from 'antd';
import autobind from 'autobind-decorator';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import { push as pushAction } from 'redux-little-router';

import handleError from 'control/utils/handleError';
import GenericFormContainer from 'control/components/recipes/GenericFormContainer';
import RecipeForm, { cleanRecipeData } from 'control/components/recipes/RecipeForm';

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

  onFormFailure(err) {
    handleError('Recipe cannot be created.', err);
  }

  onFormSuccess(newId) {
    message.success('Recipe created');
    this.props.push(`/recipe/${newId}/`);
  }

  async formAction(formValues) {
    const cleanedData = cleanRecipeData(formValues);
    return this.props.createRecipe(cleanedData);
  }

  render() {
    return (
      <div>
        <h2>Create New Recipe</h2>
        <GenericFormContainer
          form={RecipeForm}
          formAction={this.formAction}
          onSuccess={this.onFormSuccess}
          onFailure={this.onFormFailure}
          formProps={{ isCreationForm: true }}
        />
      </div>
    );
  }
}
