import { Form } from 'antd';
import autobind from 'autobind-decorator';
import PropTypes from 'prop-types';
import React from 'react';

import handleError from 'control/utils/handleError';

// Simple error class used when a form fails to validate.
export class ValidationError extends Error {
  constructor(data) {
    super();
    this.fields = data;
  }
}


/**
 * Decorator used to wrap forms for collecting and validating user input.
 * Extends antd's Form.create with a few customizations.
 *
 * @param {Object} options
 *   All unrecognized options are passed through to Form.create.
 * @param {Function} options.validateFields(values)
 *   Callback for custom validation of field values. It is passed the
 *   post-validation field values, and the return value is passed to the form's
 *   onSubmit callback. When called, `this` is bound to the instance of the
 *   component being wrapped.
 *
 * The following props are injected into components wrapped by this decorator:
 *
 * onSubmit
 *   Callback for submitting field values. Typically this is passed to the
 *   onSubmit prop of the underlying Form.
 *
 * Usage example:
 *
 * @createForm({})
 * class MyForm extends React.PureComponent {
 *   render() {
 *     const { onSubmit } = this.props;
 *     return (
 *       <Form onSubmit={onSubmit}>
 *         <FormItem name="myfield" label="My Field" initialValue="foo">
 *           <Input />
 *         </FormItem>
 *         <Button htmlType="submit">Submit</Button>
 *       </Form>
 *     );
 *   }
 * }
 *
 * ReactDOM.render(
 *   <MyForm onSubmit={values => console.log(`Result: ${values.myfield}`)} />
 *   document.getElementById('#main'),
 * );
 */
export function createForm({ validateFields, ...formConfig }) {
  return FormComponent => {
    @autobind
    class WrappedForm extends React.Component {
      static propTypes = {
        // Form object injected by Form.create.
        form: PropTypes.object.isRequired,

        // Function to call when the form is submitted. Passed an object
        // containing post-validation field values.
        onSubmit: PropTypes.func.isRequired,

        // An object containing validation errors to be shown to the user.
        // The object is shaped like the field values, but with error strings
        // instead of field values.
        errors: PropTypes.object,
      };

      static defaultProps = {
        errors: {},
      };

      // FormItem and connectFormProps access the form instance and errors via
      // the context.
      static childContextTypes = {
        form: PropTypes.object,
        formErrors: PropTypes.object,
      };

      getChildContext() {
        const { form, errors } = this.props;
        return {
          form,
          formErrors: errors,
        };
      }

      handleSubmit(event, context = {}) {
        event.preventDefault();
        this.triggerSubmit(context);
      }

      /**
       * Run validation (both rule-based and custom validation) and pass the
       * results to the onSubmit prop.
       */
      async triggerSubmit(context) {
        const {
          onBeforeSubmit = ()=>{},
          onSubmit,
        } = this.props;

        const customValidateFields = validateFields || (values => values);

        onBeforeSubmit();

        let values;
        try {
          const defaultValues = await this.defaultValidateFields();
          values = await customValidateFields.call(this.formComponent, defaultValues);
        } catch (error) {
          handleError('Could not validate form.', new ValidationError(error));

          return;
        }

        onSubmit(values, context);
      }

      async defaultValidateFields() {
        return new Promise((resolve, reject) => {
          this.props.form.validateFields((error, values) => {
            if (error) {
              reject(error);
            } else {
              resolve(values);
            }
          });
        });
      }

      render() {
        return (
          <FormComponent
            {...this.props}
            onSubmit={this.handleSubmit}
            ref={formComponent => { this.formComponent = formComponent; }}
          />
        );
      }
    }

    return Form.create(formConfig)(WrappedForm);
  };
}

/**
 * Decorator for accessing context passed down from a parent form. The following
 * props will be injected into the wrapped component:
 *
 * form
 *   The form object as injected by antd's Form.create
 * formErrors
 *   An object detailing any validation errors passed in to the parent form.
 */
export function connectFormProps(Component) {
  return class Wrapper extends React.Component {
    static wrappedComponent = Component;

    static contextTypes = {
      form: PropTypes.object,
      formErrors: PropTypes.object,
    };

    render() {
      return (
        <Component
          form={this.context.form}
          formErrors={this.context.formErrors}
          {...this.props}
        />
      );
    }
  };
}
