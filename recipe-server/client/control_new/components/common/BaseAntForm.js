import { Form, message } from 'antd';
import autobind from 'autobind-decorator';
import pt from 'prop-types';
import React from 'react';


/**
 * Base class for antd-based forms that handles displaying errors
 * from the API.
 */
@autobind
export default class BaseAntForm extends React.Component {
  static propTypes = {
    form: pt.object.isRequired,
    onSubmit: pt.func.isRequired,
    errors: pt.object,
  }

  handleSubmit(event) {
    event.preventDefault();
    this.triggerSubmit();
  }

  async triggerSubmit() {
    try {
      const values = await this.validateFields();
      this.props.onSubmit(values);
    } catch (error) {
      message.error('Could not validate form. Please correct the errors below.');
    }
  }

  async validateFields() {
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

  /**
   * Convenience wrapper for Form.Item and form.getFieldDecorator.
   *
   * Example:
   *
   * class MyForm extends BaseAntForm {
   *   render() {
   *     return (
   *       <Form onSubmit={this.handleSubmit}>
   *         <this.FormItem name="myfield" label="My Field" initialValue="foo">
   *           <Input />
   *         </this.FormItem>
   *       </Form>
   *     );
   *   }
   * }
   */
  FormItem({ children, name, initialValue, rules, config = {}, ...customItemProps }) {
    const { form, errors = {} } = this.props;

    const defaultItemProps = {};
    if (errors[name]) {
      defaultItemProps.help = errors[name];
      defaultItemProps.validateStatus = 'error';
    }
    const itemProps = { ...defaultItemProps, ...customItemProps };

    const field = form.getFieldDecorator(name, {
      initialValue,
      rules,
      ...config,
    })(children);

    return (
      <Form.Item {...itemProps}>
        {field}
      </Form.Item>
    );
  }
}

BaseAntForm.prototype.FormItem.propTypes = {
  children: pt.node,
  name: pt.string.isRequired,
  initialValue: pt.any,
  rules: pt.arrayOf(pt.object),
  config: pt.object,
};
