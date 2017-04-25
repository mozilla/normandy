import React, { PropTypes as pt } from 'react';

import { ControlField } from 'control/components/Fields';
import ActionFields from 'control/components/action_fields/ActionFields';

/**
 * Form fields for the console-log action.
 */
export default class ConsoleLogFields extends ActionFields {
  static propTypes = {
    disabled: pt.bool,
  }

  render() {
    const { disabled } = this.props;
    return (
      <div className="arguments-fields">
        <p className="info">Log a message to the console.</p>
        <ControlField
          disabled={disabled}
          label="Message"
          name="arguments.message"
          component="input"
          type="text"
        />
      </div>
    );
  }
}
