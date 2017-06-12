import { Map } from 'immutable';
import React, { PropTypes as pt } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { initialize, reduxForm } from 'redux-form';

import QueryExtension from './data/QueryExtension';
import { ControlField } from './Fields';
import { createExtension, updateExtension } from '../state/extensions/actions';
import { getExtension } from '../state/extensions/selectors';


class ExtensionForm extends React.Component {
  static propTypes = {
    createExtension: pt.func.isRequired,
    extensionId: pt.number,
    handleSubmit: pt.func.isRequired,
    initializeForm: pt.func.isRequired,
    initialValues: pt.object,
    updateExtension: pt.func.isRequired,
  }

  constructor(props) {
    super(props);

    this.handleSave = ::this.handleSave;
  }

  componentWillReceiveProps(nextProps) {
    const { initialValues, initializeForm } = this.props;

    if (initialValues.id !== nextProps.initialValues.id) {
      initializeForm('extension', nextProps.initialValues);
    }
  }

  handleSave(values) {
    const { extensionId } = this.props;
    const data = values;

    // Remove the XPI value passed through because this is the URL of the existing XPI
    if (data.xpi) {
      delete data.xpi;
    }

    // Store the newly selected XPI with the key `xpi`.
    if (data.xpiUpload) {
      data.xpi = data.xpiUpload[0];
      delete data.xpiUpload;
    }

    if (extensionId) {
      this.props.updateExtension(extensionId, data);
    } else {
      this.props.createExtension(data);
    }
  }

  render() {
    const { extensionId, handleSubmit } = this.props;

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
          extensionId ?
            <ControlField
              label="XPI URL"
              name="xpi"
              component="input"
              type="text"
              disabled
            />
            : null
        }

        <ControlField
          label="Upload New XPI"
          name="xpiUpload"
          component="input"
          type="file"
          accept=".xpi"
        />

        <div className="form-actions">
          <button
            className="button action-save submit"
            type="submit"
            onClick={handleSubmit(this.handleSave)}
          >Save</button>
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
      initialValues: getExtension(state, pk, new Map()).toJS(),
    };
  },
  dispatch => (bindActionCreators({
    initializeForm: initialize,
    createExtension,
    updateExtension,
  }, dispatch)),
)(reduxForm({ form: 'extension' })(ExtensionForm));
