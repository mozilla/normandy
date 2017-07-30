/* eslint-disable react/jsx-boolean-value */
import { Alert, Button, Icon, Input, InputNumber, Radio, Select } from 'antd';
import autobind from 'autobind-decorator';
import { List, Map } from 'immutable';
import PropTypes from 'prop-types';
import React from 'react';

import FormItem from 'control_new/components/forms/FormItem';
import { connectFormProps } from 'control_new/utils/forms';


@connectFormProps
export default class PreferenceExperimentFields extends React.Component {
  static propTypes = {
    disabled: PropTypes.bool,
    recipeArguments: PropTypes.instanceOf(Map),
  };

  static defaultProps = {
    disabled: false,
    recipeArguments: new Map(),
  };

  render() {
    const {
      disabled,
      recipeArguments,
    } = this.props;

    return (
      <div>
        <p className="action-info">Run a feature experiment activated by a preference.</p>
        <FormItem
          label="Experiment Name"
          name="arguments.slug"
          initialValue={recipeArguments.get('slug', '')}
        >
          <Input disabled={disabled} />
        </FormItem>

        <FormItem
          label="Experiment Document URL"
          name="arguments.experimentDocumentUrl"
          initialValue={recipeArguments.get('experimentDocumentUrl', '')}
        >
          <DocumentUrlInput disabled={disabled} />
        </FormItem>

        <FormItem
          label="Preference Name"
          name="arguments.preferenceName"
          initialValue={recipeArguments.get('preferenceName', '')}
        >
          <Input disabled={disabled} />
        </FormItem>

        <FormItem
          label="Preference Type"
          name="arguments.preferenceType"
          initialValue={recipeArguments.get('preferenceType', 'boolean')}
        >
          <Select disabled={disabled}>
            <Select.Option value="boolean">Boolean</Select.Option>
            <Select.Option value="integer">Integer</Select.Option>
            <Select.Option value="string">String</Select.Option>
          </Select>
        </FormItem>

        <FormItem
          label="Preference Branch Type"
          name="arguments.preferenceBranchType"
          initialValue={recipeArguments.get('preferenceBranchType', 'default')}
        >
          <PreferenceBranchSelect disabled={disabled} />
        </FormItem>

        <FormItem
          label="Experiment Branches"
          name="arguments.branches"
          initialValue={recipeArguments.get('branches', new List())}
          config={{ valuePropName: 'branches' }}
        >
          <ExperimentBranches disabled={disabled} />
        </FormItem>
      </div>
    );
  }
}

/**
 * URL input that displays a clickable link to its value.
 */
export class DocumentUrlInput extends React.Component {
  static propTypes = {
    disabled: PropTypes.bool,
    // rc-form warns if the component already has a value prop, but doesn't
    // initially provide it. So we can't have a default, and also can't require
    // it.
    // eslint-disable-next-line react/require-default-props
    value: PropTypes.string,
  };

  static defaultProps = {
    disabled: false,
  };

  render() {
    const { disabled, value, ...props } = this.props;
    let addonBefore = <span><Icon type="link" /> View</span>;
    if (value) {
      addonBefore = (
        <a href={this.props.value} target="_blank" rel="noopener noreferrer">
          {addonBefore}
        </a>
      );
    }

    return (
      <Input
        disabled={disabled}
        type="url"
        addonBefore={addonBefore}
        value={value}
        {...props}
      />
    );
  }
}

/**
 * Select that shows a warning when the user preference branch is selected.
 */
@connectFormProps
export class PreferenceBranchSelect extends React.Component {
  static propTypes = {
    disabled: PropTypes.bool,
    form: PropTypes.object.isRequired,
    onChange: PropTypes.func.isRequired,
    value: PropTypes.any,
  };

  static defaultProps = {
    disabled: false,
    value: 'default',
  };

  render() {
    const { disabled, form, onChange, value } = this.props;
    return (
      <div>
        <Select disabled={disabled} onChange={onChange} value={value}>
          <Select.Option value="default">Default</Select.Option>
          <Select.Option value="user">User</Select.Option>
        </Select>
        {form.getFieldValue('arguments.preferenceBranchType') === 'user' &&
          <Alert
            message={`
              Setting user preferences instead of default ones is not recommended.
              Do not choose this unless you know what you are doing.
            `}
            type="warning"
            showIcon
          />
        }
      </div>
    );
  }
}


/**
 * List of individual branches in the experiment.
 *
 * rc-form's implementation of nested data is buggy[1].  It only reliably
 * supports one level of nesting, but branches end up having deeply-nested
 * fields like arguments.branches[1].slug. As a workaround, ExperimentBranches
 * acts as an input for a single value, and manages the nesting internally,
 * sending it back to rc-form via the onChange prop.
 *
 * [1] https://github.com/ant-design/ant-design/issues/4711
 */
@connectFormProps
@autobind
export class ExperimentBranches extends React.Component {
  static propTypes = {
    disabled: PropTypes.bool,
    onChange: PropTypes.func.isRequired,
    branches: PropTypes.instanceOf(List).isRequired,
  };

  static defaultProps = {
    disabled: false,
  };

  handleClickDelete(index) {
    const { branches, onChange } = this.props;
    onChange(branches.delete(index));
  }

  handleClickAdd() {
    const { branches, onChange } = this.props;
    const branch = new Map({
      slug: '',
      value: undefined,
      ratio: 1,
    });
    onChange(branches.push(branch));
  }

  handleChangeBranch(index, branch) {
    const { branches, onChange } = this.props;
    onChange(branches.set(index, branch));
  }

  render() {
    const { branches, disabled } = this.props;
    return (
      <div>
        <ul className="branch-list">
          {branches.map((branch, index) => (
            <li key={index} className="branch">
              <ExperimentBranchFields
                disabled={disabled}
                branch={branch}
                fieldName={`arguments.branches[${index}]`}
                index={index}
                onChange={this.handleChangeBranch}
                onClickDelete={this.handleClickDelete}
              />
            </li>
          ))}
        </ul>
        <Button disabled={disabled} type="default" icon="plus" onClick={this.handleClickAdd}>
          Add Branch
        </Button>
      </div>
    );
  }
}

export class StringPreferenceField extends React.Component {
  render() {
    return (
      <Input {...this.props} />
    );
  }
}

export class BooleanPreferenceField extends React.Component {
  static propTypes = {
    value: PropTypes.any,
  }

  render() {
    return (
      <Radio.Group {...this.props}>
        <Radio.Button value={true}>
          <Icon type="check" /> True
        </Radio.Button>
        <Radio.Button value={false}>
          <Icon type="close" /> False
        </Radio.Button>
      </Radio.Group>
    );
  }
}

export class IntegerPreferenceField extends React.Component {
  render() {
    return (
      <InputNumber {...this.props} />
    );
  }
}

@connectFormProps
@autobind
export class ExperimentBranchFields extends React.Component {
  static propTypes = {
    branch: PropTypes.instanceOf(Map).isRequired,
    disabled: PropTypes.bool,
    fieldName: PropTypes.string.isRequired,
    form: PropTypes.object.isRequired,
    index: PropTypes.number.isRequired,
    onChange: PropTypes.func.isRequired,
    onClickDelete: PropTypes.func.isRequired,
  };

  static defaultProps = {
    disabled: false,
  };

  static VALUE_FIELDS = {
    string: StringPreferenceField,
    integer: IntegerPreferenceField,
    boolean: BooleanPreferenceField,
  };

  handleClickDelete() {
    const { index, onClickDelete } = this.props;
    onClickDelete(index);
  }

  // Bind the name parameter to individual functions to avoid re-renders due
  // to prop comparison and anonymous functions.
  handleChangeSlug(event) {
    this.handleChange('slug', event);
  }

  handleChangeValue(event) {
    this.handleChange('value', event);
  }

  handleChangeRatio(event) {
    this.handleChange('ratio', event);
  }

  handleChange(name, event) {
    const { branch, index, onChange } = this.props;

    // InputNumber passes the value as the parameter, but Input and
    // Radio pass it via event.target.value.
    let value = event;
    if (event && event.target) {
      value = event.target.value;
    }

    onChange(index, branch.set(name, value));
  }

  render() {
    const { branch, disabled, fieldName, form } = this.props;
    const preferenceType = form.getFieldValue('arguments.preferenceType');
    const ValueField = ExperimentBranchFields.VALUE_FIELDS[preferenceType];
    return (
      <div className="branch-fields">
        <FormItem
          label="Branch Name"
          name={`${fieldName}.slug`}
          connectToForm={false}
        >
          <Input
            disabled={disabled}
            value={branch.get('slug', '')}
            onChange={this.handleChangeSlug}
            id="pef-branch-name"
          />
        </FormItem>
        <FormItem
          label="Preference Value"
          name={`${fieldName}.value`}
          connectToForm={false}
        >
          <ValueField disabled={disabled} value={branch.get('value')} onChange={this.handleChangeValue} />
        </FormItem>
        <FormItem
          label="Ratio"
          name={`${fieldName}.ratio`}
          connectToForm={false}
        >
          <InputNumber disabled={disabled} value={branch.get('ratio', '')} onChange={this.handleChangeRatio} />
        </FormItem>
        <Button
          className="delete-btn"
          disabled={disabled}
          type="danger"
          icon="close"
          onClick={this.handleClickDelete}
        >
          Delete Branch
        </Button>
      </div>
    );
  }
}
