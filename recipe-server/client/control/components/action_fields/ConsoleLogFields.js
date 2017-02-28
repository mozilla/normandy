import React, { PropTypes as pt } from 'react';

import { ControlField } from 'control/components/Fields';

/**
 * Form fields for the console-log action.
 */
export default function ConsoleLogFields({ disabled }) {
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

ConsoleLogFields.propTypes = {
  disabled: pt.bool,
};
