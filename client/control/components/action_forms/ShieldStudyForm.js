import React, { PropTypes as pt } from 'react';
import FormField from '../form_fields/FormFieldWrapper.js';

export const ShieldStudyFormFields = [
  'studyName',
  'addonName',
  'addonUrl',
  'buttonText',
  'thankYouText',
  'duration',
  'authors',
];

export default function ShieldStudyForm({ fields }) {
  return (
    <div className="row">
      <p className="help row">
        This action will prompt users to participate in a specified SHIELD study.
      </p>
      <div className="fluid-4">
        <FormField type="text" label="Study Name" field={fields.studyName} />
        <FormField type="text" label="Duration" field={fields.duration} />
        <FormField type="text" label="Authors" field={fields.authors} />
        <FormField type="text" label="Addon Name" field={fields.addonName} />
        <FormField type="text" label="Addon URL" field={fields.addonUrl} />
        <FormField type="text" label="Button Text" field={fields.buttonText} />
        <FormField type="text" label="Thank You Text" field={fields.thankYouText} />
      </div>
    </div>
  );
}
ShieldStudyForm.propTypes = {
  fields: pt.object,
};
