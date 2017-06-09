import { Map } from 'immutable';
import React, { PropTypes as pt } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { initialize, reduxForm } from 'redux-form';

import QueryExtension from './data/QueryExtension';
import { ControlField } from './Fields';
import { getExtension } from '../state/extensions/selectors';


class ExtensionForm extends React.Component {
  static propTypes = {
    extensionId: pt.number,
    initializeForm: pt.func.isRequired,
    initialValues: pt.object,
  }

  componentWillReceiveProps(nextProps) {
    const { initialValues, initializeForm } = this.props;

    if (initialValues.id !== nextProps.initialValues.id) {
      initializeForm('extension', nextProps.initialValues);
    }
  }

  render() {
    const { extensionId } = this.props;

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
  }, dispatch)),
)(reduxForm({ form: 'extension' })(ExtensionForm));
