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
  static propTypes = {
    disabled: pt.bool,
  }

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

  static userBranchWarning = (
    <p className="field-warning">
      <i className="fa fa-exclamation-triangle" />
      Setting user preferences instead of default ones is not recommended.
      Do not choose this unless you know what you are doing.
    </p>
  );

  render() {
    const { disabled, preferenceBranchType } = this.props;
    return (
      <div className="arguments-fields">
        <div className="info">
          <p>
            Run a feature experiment activated by a preference.
            <br />
            <br />
            Experiments are intended for features that require testing and are NOT ready for wide
            release. If you are aiming to permanently change a preference, use a <b>Preference
            Rollout</b> action instead.
          </p>
        </div>
        <ControlField
          label="Slug"
          name="arguments.slug"
          component="input"
          type="text"
          disabled={disabled}
        />
        <ControlField
          label="Experiment Document URL"
          name="arguments.experimentDocumentUrl"
          component="input"
          type="url"
          disabled={disabled}
        />
        <ControlField
          label="Preference Name"
          name="arguments.preferenceName"
          component="input"
          type="text"
          disabled={disabled}
        />
        <ControlField
          label="Preference Type"
          name="arguments.preferenceType"
          component="select"
          disabled={disabled}
        >
          <option value="boolean">Boolean</option>
          <option value="integer">Integer</option>
          <option value="string">String</option>
        </ControlField>
        <ControlField
          label="Preference Branch Type"
          name="arguments.preferenceBranchType"
          component="select"
          disabled={disabled}
        >
          <option value="default">Default</option>
          <option value="user">User</option>
        </ControlField>
        {preferenceBranchType === 'user' && PreferenceExperimentFields.userBranchWarning}
        <FieldArray
          name="arguments.branches"
          component={PreferenceBranches}
          disabled={disabled}
        />
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
    disabled: pt.bool,
  }

  constructor(props) {
    super(props);
    this.handleClickDelete = ::this.handleClickDelete;
    this.handleClickAdd = ::this.handleClickAdd;
  }

  handleClickDelete(index) {
    if (!this.props.disabled) {
      this.props.fields.remove(index);
    }
  }

  handleClickAdd() {
    if (!this.props.disabled) {
      this.props.fields.push({ ...DEFAULT_BRANCH_VALUES });
    }
  }

  render() {
    const { fields, disabled } = this.props;
    return (
      <div>
        <h4 className="branch-header">Experiment Branches</h4>
        <ul className="branch-list">
          {fields.map((branch, index) => (
            <li key={index} className="branch">
              <ConnectedBranchFields
                branch={branch}
                index={index}
                disabled={disabled}
                onClickDelete={this.handleClickDelete}
              />
            </li>
          ))}
          {!disabled && <AddBranchButton onClick={this.handleClickAdd} />}
        </ul>
      </div>
    );
  }
}

export function AddBranchButton({ onClick }) {
  return (
    <li>
      <a className="button" onClick={onClick}>
        <i className="fa fa-plus pre" />
        Add Branch
      </a>
    </li>
  );
}
AddBranchButton.propTypes = {
  onClick: pt.func.isRequired,
};

export class BranchFields extends React.Component {
  static propTypes = {
    branch: pt.string.isRequired,
    onClickDelete: pt.func.isRequired,
    preferenceType: pt.string.isRequired,
    index: pt.number.isRequired,
    disabled: pt.bool,
  }

  constructor(props) {
    super(props);
    this.handleClickDelete = ::this.handleClickDelete;
  }

  handleClickDelete() {
    if (!this.props.disabled) {
      this.props.onClickDelete(this.props.index);
    }
  }

  render() {
    const { branch, preferenceType = 'boolean', disabled } = this.props;
    const ValueField = VALUE_FIELDS[preferenceType];
    return (
      <div className="branch-fields">
        <ControlField
          label="Branch Slug"
          name={`${branch}.slug`}
          component="input"
          type="text"
          disabled={disabled}
        />
        <ValueField name={`${branch}.value`} disabled={disabled} />
        <IntegerControlField
          label="Ratio"
          name={`${branch}.ratio`}
          disabled={disabled}
        />
        {!disabled && <RemoveBranchButton onClick={this.handleClickDelete} />}
      </div>
    );
  }
}

export function RemoveBranchButton({ onClick }) {
  return (
    <div className="remove-branch">
      <a className="button delete" onClick={onClick}>
        <i className="fa fa-times pre" />
        Remove Branch
      </a>
    </div>
  );
}
RemoveBranchButton.propTypes = {
  onClick: pt.func.isRequired,
};

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
