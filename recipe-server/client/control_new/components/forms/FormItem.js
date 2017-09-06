import { Form } from 'antd';
import autobind from 'autobind-decorator';
import get from 'lodash.get';
import PropTypes from 'prop-types';
import React from 'react';

import { connectFormProps } from 'control_new/utils/forms';


/**
 * Convenience wrapper for Form.Item and form.getFieldDecorator. This component
 * relies on the context from the createForm decorator and can only be used with
 * children of a component wrapped by it.
 *
 * NOTE: Form.getFieldDecorator tracks when its children are unmounted
 * using refs, which are not supported by stateless functional components.
 * Because of this, the child passed to FormItem must be a class-based
 * component.
 */
@autobind
@connectFormProps
export default class FormItem extends React.PureComponent {
  static propTypes = {
    // The input component used to enter data for this field.
    children: PropTypes.node.isRequired,

    // Extra config arguments to pass to form.getFieldDecorator.
    config: PropTypes.object,

    // If false, do not wrap the input component with form.getFieldDecorator.
    // Defaults to true.
    connectToForm: PropTypes.bool,

    // From connectFormProps
    form: PropTypes.object.isRequired,
    formErrors: PropTypes.object.isRequired,

    // Convenience alias for initialValue argument to form.getFieldDecorator.
    initialValue: PropTypes.any,

    // The field name where data for this field is stored (passed to
    // form.getfieldDecorator).
    name: PropTypes.string,

    // List of validation rules (passed to form.getFieldDecorator).
    rules: PropTypes.arrayOf(PropTypes.object),

    // If true, automatically trim whitespace from the value.
    trimWhitespace: PropTypes.bool,
  };

  static defaultProps = {
    config: {},
    connectToForm: true,
    initialValue: null,
    name: null,
    rules: null,
    trimWhitespace: false,
  };

  static trimValue(event) {
    // InputNumber passes the value as the parameter,
    // but Input passes it via event.target.value.
    let value = event;
    if (event && event.target) {
      value = event.target.value;
    }
    return value.trim();
  }

  render() {
    const {
      children,
      config,
      connectToForm,
      form,
      formErrors,
      initialValue,
      name,
      rules,
      trimWhitespace,
      ...customItemProps
    } = this.props;

    if (trimWhitespace) {
      if (config.getValueFromEvent) {
        throw Error('config.getValueFromEvent is already defined, do not also use trimWhitespace.');
      }
    }

    const defaultItemProps = {};
    const error = get(formErrors, name);

    if (error) {
      const errorString = error instanceof Array ? error.join(' ') : error;

      defaultItemProps.help = errorString;
      defaultItemProps.validateStatus = 'error';
    }
    const itemProps = { ...defaultItemProps, ...customItemProps };

    let field = children;
    if (connectToForm && name) {
      const fieldDecoratorArgs = { initialValue, rules, ...config };
      if (trimWhitespace) {
        fieldDecoratorArgs.getValueFromEvent = FormItem.trimValue;
      }
      field = form.getFieldDecorator(name, fieldDecoratorArgs)(children);
    }

    return (
      <Form.Item {...itemProps} colon={false}>
        {field}
      </Form.Item>
    );
  }
}
