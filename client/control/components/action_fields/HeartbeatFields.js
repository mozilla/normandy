import React from 'react';

import { ControlField } from 'components/Fields';

/**
 * Form fields for the show-heartbeat action.
 */
export default function HeartbeatFields() {
  return (
    <div className="arguments-fields">
      <p className="info">
        Shows a single message or survey prompt to the user.
      </p>
      <ControlField
        label="Survey ID"
        name="arguments.surveyId"
        component="input"
        type="text"
      />
      <ControlField
        label="Message"
        name="arguments.message"
        component="input"
        type="text"
      />
      <ControlField
        label="Engagement Button Label"
        name="arguments.engagementButtonLabel"
        component="input"
        type="text"
      />
      <ControlField
        label="Thanks Message"
        name="arguments.thanksMessage"
        component="input"
        type="text"
      />
      <ControlField
        label="Post-Answer URL"
        name="arguments.postAnswerUrl"
        component="input"
        type="text"
      />
      <ControlField
        label="Include unique user ID in Post-Answer URL (and Telemetry)"
        name="arguments.includeTelemetryUUID"
        component="input"
        type="checkbox"
        className="checkbox-field"
      />
      <ControlField
        label="Learn More Message"
        name="arguments.learnMoreMessage"
        component="input"
        type="text"
      />
      <ControlField
        label="Learn More URL"
        name="arguments.learnMoreUrl"
        component="input"
        type="text"
      />
    </div>
  );
}
