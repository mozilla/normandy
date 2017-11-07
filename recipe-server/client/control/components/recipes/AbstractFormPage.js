import autobind from 'autobind-decorator';
import PropTypes from 'prop-types';
import React from 'react';

@autobind
export default class AbstractFormPage extends React.PureComponent {
  static propTypes = {
    recipeAction: PropTypes.func.isRequired,
  };

  state = {
    formErrors: undefined,
  };

  /* hook */ onBeforeSubmit() {
    this.setState({
      formErrors: undefined,
    });
  }

  /* abstract */ onFailure() {
    throw new Error('AbstractFormPage#onFailure should be overridden.');
  }

  /* abstract */ onSuccess() {
    throw new Error('AbstractFormPage#onSuccess should be overridden.');
  }

  /* hook */ getFormProps() {
    return {};
  }

  /* abstract */ getFormComponent() {
    throw new Error('AbstractFormPage#getFormComponent should be overridden.');
  }

  /* abstract */ getTitle() {
    throw new Error('AbstractFormPage#getTitle should be overridden.');
  }

  /* abstract */ async performAction() {
    throw new Error('AbstractFormPage#onSuccess should be overridden.');
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
    const FormElement = this.getFormComponent();

    return (
      <div>
        { this.getTitle() }
        <FormElement
          onBeforeSubmit={this.onBeforeSubmit}
          onSubmit={this.handleSubmit}
          errors={this.state.formErrors}
          {...this.getFormProps()}
        />
      </div>
    );
  }
}
