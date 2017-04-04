import React, { PropTypes as pt } from 'react';
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
  ratio: 1,
};

/**
 * Form fields for the preference-experiment action.
 */
export class PreferenceExperimentFields extends ActionFields {
  static initialValues = {
    slug: '',
    experimentDocumentUrl: '',
    preferenceName: '',
    preferenceType: 'boolean',
    preferenceBranchType: 'default',
  }

  static propTypes = {
    preferenceBranchType: pt.string.isRequired,
  }

  render() {
    const { preferenceBranchType } = this.props;
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
        <ControlField
          label="Preference Branch Type"
          name="arguments.preferenceBranchType"
          component="select"
        >
          <option value="default">Default</option>
          <option value="user">User</option>
        </ControlField>
        {preferenceBranchType === 'user' &&
          <p className="field-warning">
            <i className="fa fa-exclamation-triangle" />
            Setting user preferences instead of default ones is not recommended.
            Do not choose this unless you know what you are doing.
          </p>
        }
        <FieldArray name="arguments.branches" component={PreferenceBranches} />
      </div>
    );
  }
}

export default connect(
  state => ({
    preferenceBranchType: selector(state, 'arguments.preferenceBranchType'),
  })
)(PreferenceExperimentFields);

export class PreferenceBranches extends React.Component {
  static propTypes = {
    fields: pt.object.isRequired,
  }

  constructor(props) {
    super(props);
    this.handleClickDelete = ::this.handleClickDelete;
    this.handleClickAdd = ::this.handleClickAdd;
  }

  handleClickDelete(index) {
    this.props.fields.remove(index);
  }

  handleClickAdd() {
    this.props.fields.push({ ...DEFAULT_BRANCH_VALUES });
  }

  render() {
    const { fields } = this.props;
    return (
      <div>
        <h4 className="branch-header">Experiment Branches</h4>
        <ul className="branch-list">
          {fields.map((branch, index) => (
            <li key={index} className="branch">
              <ConnectedBranchFields
                branch={branch}
                index={index}
                onClickDelete={this.handleClickDelete}
              />
            </li>
          ))}
          <li>
            <a
              className="button"
              onClick={this.handleClickAdd}
            >
              <i className="fa fa-plus pre" />
              Add Branch
            </a>
          </li>
        </ul>
      </div>
    );
  }
}

export class BranchFields extends React.Component {
  static propTypes = {
    branch: pt.string.isRequired,
    onClickDelete: pt.func.isRequired,
    preferenceType: pt.string.isRequired,
    index: pt.number.isRequired,
  }

  constructor(props) {
    super(props);
    this.handleClickDelete = ::this.handleClickDelete;
  }

  handleClickDelete() {
    this.props.onClickDelete(this.props.index);
  }

  render() {
    const { branch, preferenceType = 'boolean' } = this.props;
    const ValueField = VALUE_FIELDS[preferenceType];
    return (
      <div className="branch-fields">
        <ControlField
          label="Branch Slug"
          name={`${branch}.slug`}
          component="input"
          type="text"
        />
        <ValueField name={`${branch}.value`} />
        <IntegerControlField
          label="Ratio"
          name={`${branch}.ratio`}
        />
        <div className="remove-branch">
          <a className="button delete" onClick={this.handleClickDelete}>
            <i className="fa fa-times pre" />
            Remove Branch
          </a>
        </div>
      </div>
    );
  }
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
