import React from 'react';

import { ControlField } from 'control/components/Fields';
import ActionFields from 'control/components/action_fields/ActionFields';

/**
 * Form fields for the console-log action.
 */
export default class ConsoleLogFields extends ActionFields {
  render() {
    return (
      <div className="arguments-fields">
        <p className="info">Log a message to the console.</p>
        <ControlField
          label="Message"
          name="arguments.message"
          component="input"
          type="text"
        />
      </div>
    );
  }
}
