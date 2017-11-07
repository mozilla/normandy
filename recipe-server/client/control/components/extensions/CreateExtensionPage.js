import { message } from 'antd';
import autobind from 'autobind-decorator';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import { push as pushAction } from 'redux-little-router';

import handleError from 'control/utils/handleError';
import ExtensionForm from 'control/components/extensions/ExtensionForm';
import {
  createExtension as createExtensionAction,
} from 'control/state/app/extensions/actions';


@connect(
  null,
  {
    createExtension: createExtensionAction,
    push: pushAction,
  },
)
@autobind
export default class CreateExtensionPage extends React.PureComponent {
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

    this.setState({ formErrors: undefined });

    try {
      const extensionId = await createExtension(values);
      message.success('Extension saved');
      push(`/extension/${extensionId}/`);
    } catch (error) {
      handleError('Extension cannot be saved.', error);

      this.setState({ formErrors: error.data || error });
    }
  }

  render() {
    const { formErrors } = this.state;
    return (
      <ExtensionForm onSubmit={this.handleSubmit} errors={formErrors} />
    );
  }
}
