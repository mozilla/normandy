import { message } from 'antd';
import autobind from 'autobind-decorator';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import { push as pushAction } from 'redux-little-router';

import AbstractFormPage from 'control/components/recipes/AbstractFormPage';
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
export default class CreateExtensionPage extends AbstractFormPage {
  static propTypes = {
    createExtension: PropTypes.func.isRequired,
    push: PropTypes.func.isRequired,
  }

  getTitle() {
    return <h2>Add New Extension</h2>;
  }

  getFormComponent() {
    return ExtensionForm;
  }

  async performAction(values) {
    const { createExtension } = this.props;
    return createExtension(values);
  }

  onSuccess(extensionId) {
    const { push } = this.props;
    message.success('Extension saved');
    push(`/extension/${extensionId}/`);
  }

  onFailure(err) {
    handleError('Extension cannot be saved.', err);
  }
}
