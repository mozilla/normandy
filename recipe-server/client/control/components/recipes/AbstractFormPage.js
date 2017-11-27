/* eslint-disable react/sort-comp */
import autobind from 'autobind-decorator';
import React from 'react';

/**
 * A handful of pages deal with forms and perform very similar operations, such
 * as processing form submission, handling validation, and success/fail cases.
 * This is a base component used to simplify and reduce duplicate logic across pages.
 *
 * Usage consists of extending `AbstractFormPage` and overriding a few methods; see below.
 */

@autobind
export default class AbstractFormPage extends React.PureComponent {
  static propTypes = {};

  // The `formErrors` state attribute is available within the component, however
  // it is highly recommended to not modify this piece of state.
  state = {
    formErrors: undefined,
  };

  /**
   * Returns a DOM or React node that is displayed above the form. This can simply
   * be a string or something more complicated like a div with nested children.
   *
   * @abstract
   * @return {HTMLElement|React.Component}    DOM element to display.
   */
  getHeader() {
    throw new Error('AbstractFormPage#getHeader should be overridden.');
  }

  /**
   * Returns a React node which serves as the main 'form' element on the page.
   * The returned component must be wrapped in `createForm` (see control/utils/forms).
   *
   * @abstract
   * @return {React.Component}   React component to use for the form
   */
  getFormComponent() {
    throw new Error('AbstractFormPage#getFormComponent should be overridden.');
  }

  /**
   * The embedded form element can be passed custom props if necessary.
   */
  getFormProps() {
    return {};
  }

  /**
   * Clear the present form errors just before submitting the form.
   */
  onBeforeSubmit() {
    this.setState({
      formErrors: undefined,
    });
  }

  /**
   * Update the existing recipe and display a message.
   * @param {Object} formValues     Key-value pairs from the form's fields.
   */
  async handleSubmit(formValues) {
    try {
      const actionValues = await this.processForm(formValues);

      this.onProcessSuccess(...actionValues);
    } catch (error) {
      this.setState({
        formErrors: error.data || error,
      });

      this.onProcessFailure(error);
    }
  }

  /**
   * Function to handle the actual API call/operation of the form.
   * Fired with an object of form values, if the form passes validation.
   *
   * @abstract
   * @param {Object} values   Key-value object of form fields and their values.
   */
  async processForm() {
    throw new Error('AbstractFormPage#processForm should be overridden.');
  }

  /**
   * Fired when an error prevents the form process from completing successfully.
   * This could be form validation, a server error, or something else.
   *
   * @abstract
   * @param {Error} error   Error object with more info, probably from the server.
   */
  onProcessFailure() {
    throw new Error('AbstractFormPage#onProcessFailure should be overridden.');
  }

  /**
   * Fired after the form process is completed successfully. Typically, this is
   * where you would `push` the user to a new URL, or update messaging on the page.
   *
   * @abstract
   */
  onProcessSuccess() {
    throw new Error('AbstractFormPage#onProcessSuccess should be overridden.');
  }

  /**
   * Render does not need to be overridden in extended pages. If you choose to
   * create a custom render function, be sure to call `super.render.call(this)`.
   */
  render() {
    const FormElement = this.getFormComponent();

    return (
      <div>
        { this.getHeader() }
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
