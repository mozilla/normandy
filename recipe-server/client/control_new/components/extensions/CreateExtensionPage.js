import { message } from 'antd';
import autobind from 'autobind-decorator';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { push as pushAction } from 'redux-little-router';

import ExtensionForm from 'control_new/components/extensions/ExtensionForm';
import * as extensionActions from 'control_new/state/extensions/actions';


@connect(
  null,
  dispatch => (bindActionCreators({
    createExtension: extensionActions.createExtension,
    push: pushAction,
  }, dispatch)),
)
@autobind
export default class CreateExtensionPage extends React.Component {
  static propTypes = {
    createExtension: PropTypes.func.isRequired,
    push: PropTypes.func.isRequired,
  }

  state = {
    formErrors: {},
  };

  /**
   * Create a new extension, display a message, and redirect to the edit page
   * for the new extension.
   */
  async handleSubmit(values) {
    const { createExtension, push } = this.props;
    try {
      const extensionId = await createExtension(values);
      message.success('Extension saved');
      push(`/extension/${extensionId}`);
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
    const { formErrors } = this.state;
    return (
      <ExtensionForm onSubmit={this.handleSubmit} errors={formErrors} />
    );
  }
}
