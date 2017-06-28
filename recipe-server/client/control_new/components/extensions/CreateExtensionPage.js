import { message } from 'antd';
import autobind from 'autobind-decorator';
import React, { PropTypes as pt } from 'react';
import { connect } from 'react-redux';
import { push } from 'redux-little-router';

import ExtensionForm from 'control_new/components/extensions/ExtensionForm';
import { createExtension } from 'control_new/state/extensions/actions';


@autobind
export class _CreateExtensionPage extends React.Component {
  static propTypes = {
    createExtension: pt.func.isRequired,
    push: pt.func.isRequired,
  }

  constructor(props) {
    super(props);
    this.state = {
      formErrors: undefined,
    };
  }

  /**
   * Create a new extension, display a message, and redirect to the edit page
   * for the new extension.
   */
  async handleSubmit(values) {
    try {
      const extensionId = await this.props.createExtension(values);
      message.success('Extension saved');
      this.props.push(`/extension/${extensionId}/`);
    } catch (error) {
      message.error(
        'Extension cannot be saved. Please correct any errors listed in the form below.',
      );
      if (error.data) {
        this.setState({ formErrors: error.data });
      }
    }
  }

  render() {
    return (
      <ExtensionForm onSubmit={this.handleSubmit} errors={this.state.formErrors} />
    );
  }
}

export default connect(
  null,
  {
    createExtension,
    push,
  },
)(_CreateExtensionPage);
