import autobind from 'autobind-decorator';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import RecipeForm from 'control/components/recipes/RecipeForm';

@autobind
export default class AbstractRecipePage extends React.PureComponent {
  static propTypes = {
    recipeAction: PropTypes.func.isRequired,
  };

  state = {
    formErrors: undefined,
  };

  /* abstract */ getTitle() {
    throw new Error('AbstractRecipePage#getTitle should be overridden.');
  }

  /* abstract */ onFailure() {
    throw new Error('AbstractRecipePage#onFailure should be overridden.');
  }

  /* abstract */ onSuccess() {
    throw new Error('AbstractRecipePage#onSuccess should be overridden.');
  }

  /* abstract */ async performAction() {
    throw new Error('AbstractRecipePage#onSuccess should be overridden.');
  }


  /* hook */ getFormProps() {
    return {};
  }

  /* hook */ onBeforeSubmit() {
    this.setState({
      formErrors: undefined,
    });
  }


  /**
   * Update the existing recipe and display a message.
   */
  async handleSubmit(formValues) {
    try {
      const actionValues = await this.performAction(formValues);

      this.onSuccess(...actionValues);
    } catch (error) {
      this.setState({
        formErrors: error.data || error,
      });

      this.onFailure(error);
    }
  }

  render() {
    return (
      <div>
        { this.getTitle() }
        <RecipeForm
          onBeforeSubmit={this.onBeforeSubmit}
          onSubmit={this.handleSubmit}
          errors={this.state.formErrors}
          { ...this.getFormProps() }
        />
      </div>
    );
  }
}
