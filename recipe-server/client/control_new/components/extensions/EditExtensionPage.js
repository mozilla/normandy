import { message } from 'antd';
import autobind from 'autobind-decorator';
import { Map } from 'immutable';
import React, { PropTypes as pt } from 'react';
import { connect } from 'react-redux';

import QueryExtension from 'control_new/components/data/QueryExtension';
import ExtensionForm from 'control_new/components/extensions/ExtensionForm';
import { updateExtension } from 'control_new/state/extensions/actions';
import { getExtension } from 'control_new/state/extensions/selectors';
import { getRouterParam } from 'control_new/state/router/selectors';


@autobind
export class _EditExtensionPage extends React.Component {
  static propTypes = {
    updateExtension: pt.func.isRequired,
    extensionPk: pt.number,
    extension: pt.instanceOf(Map),
  }

  constructor(props) {
    super(props);
    this.state = {
      formErrors: undefined,
    };
  }

  /**
   * Update the existing extension and display a message.
   */
  async handleSubmit(values) {
    const { extensionPk } = this.props;
    try {
      await this.props.updateExtension(extensionPk, values);
      message.success('Extension saved');
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
    const { extension, extensionPk } = this.props;
    return (
      <div>
        <h2>Edit Extension</h2>
        <QueryExtension pk={extensionPk} />
        {extension &&
          <ExtensionForm
            extension={extension}
            onSubmit={this.handleSubmit}
            errors={this.state.formErrors}
          />
        }
      </div>
    );
  }
}

export default connect(
  state => {
    const extensionPk = Number.parseInt(getRouterParam(state, 'pk'), 10);
    return {
      extensionPk,
      extension: getExtension(state, extensionPk),
    };
  },
  {
    updateExtension,
  },
)(_EditExtensionPage);
