/* eslint-disable react/jsx-boolean-value */
import { Alert, Button, Icon, Input, InputNumber, Radio, Select } from 'antd';
import autobind from 'autobind-decorator';
import { List, Map } from 'immutable';
import pt from 'prop-types';
import React from 'react';

import { connectFormProps, FormItem } from 'control_new/components/common/forms';


@connectFormProps
export default class PreferenceExperimentFields extends React.Component {
  static propTypes = {
    recipeArguments: pt.instanceOf(Map).isRequired,
  }

  render() {
    const { recipeArguments = new Map() } = this.props;
    return (
      <div>
        <p className="action-info">Run a feature experiment activated by a preference.</p>
        <FormItem
          label="Experiment Name"
          name="arguments.slug"
          initialValue={recipeArguments.get('slug')}
        >
          <Input />
        </FormItem>

        <FormItem
          label="Experiment Document URL"
          name="arguments.experimentDocumentUrl"
          initialValue={recipeArguments.get('experimentDocumentUrl')}
        >
          <DocumentUrlInput />
        </FormItem>

        <FormItem
          label="Preference Name"
          name="arguments.preferenceName"
          initialValue={recipeArguments.get('preferenceName')}
        >
          <Input />
        </FormItem>

        <FormItem
          label="Preference Type"
          name="arguments.preferenceType"
          initialValue={recipeArguments.get('preferenceType', 'boolean')}
        >
          <Select>
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
          <PreferenceBranchSelect />
        </FormItem>

        <FormItem
          label="Experiment Branches"
          name="arguments.branches"
          initialValue={recipeArguments.get('branches', new List())}
          config={{ valuePropName: 'branches' }}
        >
          <ExperimentBranches />
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
    value: pt.string,
  }

  static defaultProps = {
    value: '',
  }

  render() {
    const { value, ...props } = this.props;
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
    form: pt.object.isRequired,
    onChange: pt.func.isRequired,
    value: pt.any,
  }

  static defaultProps = {
    value: 'default',
  }

  render() {
    const { form, onChange, value } = this.props;
    return (
      <div>
        <Select onChange={onChange} value={value}>
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
    onChange: pt.func.isRequired,
    branches: pt.instanceOf(List).isRequired,
  }

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
    const { branches } = this.props;
    return (
      <div>
        <ul className="branch-list">
          {branches.map((branch, index) => (
            <li key={index} className="branch">
              <ExperimentBranchFields
                branch={branch}
                fieldName={`arguments.branches[${index}]`}
                index={index}
                onChange={this.handleChangeBranch}
                onClickDelete={this.handleClickDelete}
              />
            </li>
          ))}
        </ul>
        <Button type="default" icon="plus" onClick={this.handleClickAdd}>
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
    value: pt.any,
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
    branch: pt.instanceOf(Map).isRequired,
    fieldName: pt.string.isRequired,
    form: pt.object.isRequired,
    index: pt.number.isRequired,
    onChange: pt.func.isRequired,
    onClickDelete: pt.func.isRequired,
  }

  static VALUE_FIELDS = {
    string: StringPreferenceField,
    integer: IntegerPreferenceField,
    boolean: BooleanPreferenceField,
  }

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
    const { branch, fieldName, form } = this.props;
    const preferenceType = form.getFieldValue('arguments.preferenceType');
    const ValueField = ExperimentBranchFields.VALUE_FIELDS[preferenceType];
    return (
      <div className="branch-fields">
        <FormItem
          label="Branch Name"
          name={`${fieldName}.slug`}
          connectToForm={false}
        >
          <Input value={branch.get('slug')} onChange={this.handleChangeSlug} />
        </FormItem>
        <FormItem
          label="Preference Value"
          name={`${fieldName}.value`}
          connectToForm={false}
        >
          <ValueField value={branch.get('value')} onChange={this.handleChangeValue} />
        </FormItem>
        <FormItem
          label="Ratio"
          name={`${fieldName}.ratio`}
          connectToForm={false}
        >
          <InputNumber value={branch.get('ratio')} onChange={this.handleChangeRatio} />
        </FormItem>
        <Button type="danger" icon="close" className="delete-btn" onClick={this.handleClickDelete}>
          Delete Branch
        </Button>
      </div>
    );
  }
}
