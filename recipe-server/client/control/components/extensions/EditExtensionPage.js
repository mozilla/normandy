import { message } from 'antd';
import autobind from 'autobind-decorator';
import { Map, is } from 'immutable';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import AbstractFormPage from 'control/components/recipes/AbstractFormPage';
import handleError from 'control/utils/handleError';
import LoadingOverlay from 'control/components/common/LoadingOverlay';
import QueryExtension from 'control/components/data/QueryExtension';
import ExtensionForm from 'control/components/extensions/ExtensionForm';
import {
  updateExtension as updateExtensionAction,
} from 'control/state/app/extensions/actions';
import { getExtension } from 'control/state/app/extensions/selectors';
import { getUrlParamAsInt } from 'control/state/router/selectors';
import { addSessionView as addSessionViewAction } from 'control/state/app/session/actions';

@connect(
  state => {
    const extensionId = getUrlParamAsInt(state, 'extensionId');
    const extension = getExtension(state, extensionId, new Map());
    return {
      extension,
      extensionId,
    };
  },
  {
    updateExtension: updateExtensionAction,
    addSessionView: addSessionViewAction,
  },
)
@autobind
export default class EditExtensionPage extends AbstractFormPage {
  static propTypes = {
    extension: PropTypes.instanceOf(Map).isRequired,
    extensionId: PropTypes.number.isRequired,
    updateExtension: PropTypes.func.isRequired,
    addSessionView: PropTypes.func.isRequired,
  }

  componentDidMount() {
    const extensionName = this.props.extension.get('name');
    if (extensionName) {
      this.props.addSessionView('extension', extensionName, this.props.extension.get('identicon_seed'));
    }
  }

  componentWillReceiveProps({ extension }) {
    const oldExtensions = this.props.extension;

    // New extension means we add a session view.
    if (!is(oldExtensions, extension) && oldExtensions.get('name') !== extension.get('name')) {
      const extensionName = extension.get('name');
      this.props.addSessionView('extension', extensionName, extension.get('identicon_seed'));
    }
  }

  getTitle() {
    return <h2>Edit Extension</h2>;
  }

  getFormProps() {
    const { extension } = this.props;
    return { extension };
  }

  getFormComponent() {
    return ExtensionForm;
  }

  async performAction(values) {
    const { updateExtension, extensionId } = this.props;
    return updateExtension(extensionId, values);
  }

  onSuccess() {
    message.success('Extension updated!');
  }

  onFailure(err) {
    handleError('Extension cannot be updated.', err);
  }

  render() {
    const { extensionId } = this.props;
    return (
      <div>
        <QueryExtension pk={extensionId} />
        <LoadingOverlay requestIds={`fetch-extension-${extensionId}`}>
          { super.render.call(this) }
        </LoadingOverlay>
      </div>
    );
  }
}
