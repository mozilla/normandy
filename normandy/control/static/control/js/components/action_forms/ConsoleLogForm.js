import React, { PropTypes as pt } from 'react';
import FormField from '../form_fields/FormFieldWrapper.js';

export const ConsoleLogFormFields = ['message'];

export default function ConsoleLogForm({ fields }) {
  return (
    <div>
      <p className="help row">Log a message to the console.</p>
      <FormField type="text" label="Message" field={fields.message} containerClass="fluid-3" />
    </div>
  );
}
ConsoleLogForm.propTypes = {
  fields: pt.object,
};
