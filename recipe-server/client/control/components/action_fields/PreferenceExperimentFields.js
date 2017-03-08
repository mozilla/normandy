import React from 'react';
import { FieldArray } from 'redux-form';
import { connect } from 'react-redux';

import {
  BooleanRadioControlField,
  ControlField,
  ErrorMessageField,
  IntegerControlField,
} from 'control/components/Fields';
import { selector } from 'control/components/RecipeForm';
import ActionFields from 'control/components/action_fields/ActionFields';

const VALUE_FIELDS = {
  string: StringPreferenceField,
  integer: IntegerPreferenceField,
  boolean: BooleanPreferenceField,
};
const DEFAULT_BRANCH_VALUES = {
  slug: '',
  bucketCount: 10,
};

/**
 * Form fields for the preference-experiment action.
 */
export default class PreferenceExperimentFields extends ActionFields {
  static initialValues = {
    slug: '',
    experimentDocumentUrl: '',
    preferenceName: '',
    preferenceType: 'boolean',
  }

  render() {
    return (
      <div className="arguments-fields">
        <p className="info">Run a feature experiment activated by a preference.</p>
        <ControlField
          label="Slug"
          name="arguments.slug"
          component="input"
          type="text"
        />
        <ControlField
          label="Experiment Document URL"
          name="arguments.experimentDocumentUrl"
          component="input"
          type="url"
        />
        <ControlField
          label="Preference Name"
          name="arguments.preferenceName"
          component="input"
          type="text"
        />
        <ControlField
          label="Preference Type"
          name="arguments.preferenceType"
          component="select"
        >
          <option value="boolean">Boolean</option>
          <option value="integer">Integer</option>
          <option value="string">String</option>
        </ControlField>
        <FieldArray name="arguments.branches" component={renderBranches} />
      </div>
    );
  }
}

export function renderBranches({ fields }) {
  return (
    <div>
      <h4 className="branch-header">Experiment Branches</h4>
      <ul className="branch-list">
        {fields.map((branch, index) => (
          <li key={index} className="branch">
            <ConnectedBranchFields
              branch={branch}
              onClickDelete={() => fields.remove(index)}
            />
          </li>
        ))}
        <li>
          <a
            className="button"
            onClick={() => fields.push(Object.assign({}, DEFAULT_BRANCH_VALUES))}
          >
            <i className="fa fa-plus pre" />
            Add Branch
          </a>
        </li>
      </ul>
    </div>
  );
}

export function BranchFields({ branch, onClickDelete, preferenceType = 'boolean' }) {
  const ValueField = VALUE_FIELDS[preferenceType];
  return (
    <div className="branch-fields">
      <ControlField
        label="Slug"
        name={`${branch}.slug`}
        component="input"
        type="text"
      />
      <ValueField name={`${branch}.value`} />
      <IntegerControlField
        label="Sample Buckets"
        name={`${branch}.bucketCount`}
      />
      <div className="remove-branch">
        <a className="button delete" onClick={onClickDelete}>
          <i className="fa fa-times pre" />
          Remove Branch
        </a>
      </div>
    </div>
  );
}

export const ConnectedBranchFields = connect(
  state => ({
    preferenceType: selector(state, 'arguments.preferenceType'),
  })
)(BranchFields);

export function StringPreferenceField(props) {
  return (
    <ControlField
      label="Preference Value"
      component="input"
      type="text"
      {...props}
    />
  );
}

export function BooleanPreferenceField(props) {
  return (
    <fieldset className="fieldset">
      <legend className="fieldset-label">Preference Value</legend>
      <ErrorMessageField {...props} />
      <BooleanRadioControlField
        label="True"
        value="true"
        hideErrors
        {...props}
      />
      <BooleanRadioControlField
        label="False"
        value="false"
        hideErrors
        {...props}
      />
    </fieldset>
  );
}

export function IntegerPreferenceField(props) {
  return (
    <IntegerControlField label="Preference Value" {...props} />
  );
}
