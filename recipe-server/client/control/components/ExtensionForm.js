import { Map } from 'immutable';
import React, { PropTypes as pt } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { Field, initialize, reduxForm } from 'redux-form';
import _ from 'underscore';

import QueryExtension from 'control/components/data/QueryExtension';
import { ControlField } from 'control/components/Fields';
import { showNotification } from 'control/actions/NotificationActions';
import { createExtension, updateExtension } from 'control/state/extensions/actions';
import { getExtension } from 'control/state/extensions/selectors';


const adaptFileEventToValue = delegate =>
  e => delegate(e.target.files[0]);

const FileInput = ({
  input: {
    value: omitValue, // eslint-disable-line no-unused-vars
    onChange,
    onBlur,
    ...inputProps,
  },
  meta: omitMeta, // eslint-disable-line no-unused-vars
  ...props,
}) => (
  <input
    onChange={adaptFileEventToValue(onChange)}
    onBlur={adaptFileEventToValue(onBlur)}
    type="file"
    {...inputProps}
    {...props}
  />
);

FileInput.propTypes = {
  input: pt.object,
  meta: pt.any,
};


class ExtensionForm extends React.Component {
  static propTypes = {
    createExtension: pt.func.isRequired,
    extension: pt.object,
    extensionId: pt.number,
    handleSubmit: pt.func.isRequired,
    initializeForm: pt.func.isRequired,
    initialValues: pt.object,
    showNotification: pt.func.isRequired,
    updateExtension: pt.func.isRequired,
  }

  constructor(props) {
    super(props);

    this.handleSave = ::this.handleSave;
  }

  componentWillReceiveProps(nextProps) {
    const { initialValues, initializeForm } = this.props;

    if (!_.isEqual(initialValues, nextProps.initialValues)) {
      initializeForm('extension', nextProps.initialValues);
    }
  }

  async handleSave(values) {
    const { extensionId } = this.props;
    const data = values;

    if (!(data.xpi instanceof File)) {
      delete data.xpi;
    }

    try {
      if (extensionId) {
        await this.props.updateExtension(extensionId, data);
      } else {
        await this.props.createExtension(data);
      }

      this.props.showNotification({
        messageType: 'success',
        message: 'Extension saved.',
      });
    } catch (error) {
      this.props.showNotification({
        messageType: 'error',
        message: 'Extension cannot be saved. Please correct any errors listed in the form below.',
      });
    }
  }

  render() {
    const { extension, extensionId, handleSubmit } = this.props;

    return (
      <form className="recipe-form">
        {
          extensionId ?
            <QueryExtension pk={extensionId} />
            : null
        }

        <ControlField
          label="Name"
          name="name"
          component="input"
          type="text"
        />

        {
          extension &&
            <label className="form-field">
              <span className="label">XPI URL</span>
              <a className="display-field" href={extension.get('xpi', '#')} target="_blank">
                {extension.get('xpi')}
              </a>
            </label>
        }

        <label className="form-field">
          <span className="label">Upload a new XPI</span>
          <Field name="xpi" component={FileInput} accept=".xpi" />
        </label>

        <div className="form-actions">
          <button
            className="button action-save submit"
            type="submit"
            onClick={handleSubmit(this.handleSave)}
          >
            Save
          </button>
        </div>
      </form>
    );
  }
}

export default connect(
  (state, props) => {
    const pk = parseInt(props.params.pk, 10);
    return {
      extensionId: pk,
      extension: getExtension(state, pk, new Map()),
      initialValues: getExtension(state, pk, new Map()).toJS(),
    };
  },
  dispatch => (bindActionCreators({
    initializeForm: initialize,
    createExtension,
    showNotification,
    updateExtension,
  }, dispatch)),
)(reduxForm({ form: 'extension' })(ExtensionForm));
