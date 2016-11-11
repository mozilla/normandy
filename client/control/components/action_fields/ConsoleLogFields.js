import React from 'react';

import { ControlField } from '../Fields.js';

/**
 * Form fields for the console-log action.
 */
export default function ConsoleLogFields() {
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
