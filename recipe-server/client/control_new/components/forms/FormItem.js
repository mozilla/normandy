import { Form } from 'antd';
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
@connectFormProps
export default class FormItem extends React.Component {
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
  };

  static defaultProps = {
    config: {},
    connectToForm: true,
    initialValue: null,
    name: null,
    rules: null,
  };

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
      ...customItemProps
    } = this.props;

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
      field = form.getFieldDecorator(name, {
        initialValue,
        rules,
        ...config,
      })(children);
    }

    return (
      <Form.Item {...itemProps} colon={false}>
        {field}
      </Form.Item>
    );
  }
}
