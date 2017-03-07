import React from 'react';

import { ControlField } from 'control/components/Fields';

/**
 * Form fields for the preference-experiment action.
 */
export default function PreferenceExperimentFields() {
  return (
    <div className="arguments-fields">
      <p className="info">Run a feature experiment activated by a preference.</p>
      <ControlField
        label="Message"
        name="arguments.message"
        component="input"
        type="text"
      />
    </div>
  );
}
