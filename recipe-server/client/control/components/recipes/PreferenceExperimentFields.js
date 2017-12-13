/* eslint-disable react/jsx-boolean-value */
import { Row, Col, Alert, Button, Icon, Input, InputNumber, Radio, Select } from 'antd';
import autobind from 'autobind-decorator';
import { List, Map } from 'immutable';
import PropTypes from 'prop-types';
import React from 'react';

import DocumentUrlInput from 'control/components/forms/DocumentUrlInput';
import FormItem from 'control/components/forms/FormItem';
import SwitchBox from 'control/components/forms/SwitchBox';
import { connectFormProps } from 'control/utils/forms';


@connectFormProps
export default class PreferenceExperimentFields extends React.Component {
  static propTypes = {
    disabled: PropTypes.bool,
    form: PropTypes.object.isRequired,
    recipeArguments: PropTypes.instanceOf(Map),
  };

  static defaultProps = {
    disabled: false,
    recipeArguments: new Map(),
  };

  render() {
    const {
      disabled,
      form,
      recipeArguments,
    } = this.props;

    return (
      <Row>
        <p className="action-info">Run a feature experiment activated by a preference.</p>
        <Col sm={24} md={11}>
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
            label="High volume recipe"
            name="arguments.isHighVolume"
            initialValue={recipeArguments.get('isHighVolume')}
          >
            <SwitchBox disabled={disabled}>
              Affects the experiment type reported to telemetry, and
              can be used to filter recipe data in analysis. This
              should be set to true on recipes that affect a
              significant percentage of release.
            </SwitchBox>
          </FormItem>
        </Col>

        <Col sm={24} md={{ span: 12, offset: 1 }}>
          <FormItem
            label="Preference Name"
            name="arguments.preferenceName"
            initialValue={recipeArguments.get('preferenceName', '')}
            trimWhitespace
          >
            <Input disabled={disabled} />
          </FormItem>

          <Col sm={24}>
            <Col xs={24} sm={11}>
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
            </Col>
            <Col xs={24} sm={{ span: 12, offset: 1 }}>
              <FormItem
                label="Preference Branch Type"
                name="arguments.preferenceBranchType"
                initialValue={recipeArguments.get('preferenceBranchType', 'default')}
              >
                <PreferenceBranchSelect disabled={disabled} />
              </FormItem>
            </Col>
            {form.getFieldValue('arguments.preferenceBranchType') === 'user' &&
              <Col xs={24}>
                <Alert
                  message="User Preference Branch"
                  description={
                    <span>
                      Setting user preferences instead of default ones is not recommended.<br />
                      Do not choose this unless you know what you are doing.
                    </span>
                  }
                  type="warning"
                  showIcon
                />
              </Col>
            }
          </Col>
        </Col>

        <Col sm={24}>
          <FormItem
            label="Experiment Branches"
            name="arguments.branches"
            initialValue={recipeArguments.get('branches', new List())}
            config={{ valuePropName: 'branches' }}
          >
            <ExperimentBranches disabled={disabled} />
          </FormItem>
        </Col>
      </Row>
    );
  }
}

/**
 * Select that shows a warning when the user preference branch is selected.
 */
@connectFormProps
export class PreferenceBranchSelect extends React.PureComponent {
  static propTypes = {
    disabled: PropTypes.bool,
    onChange: PropTypes.func.isRequired,
    value: PropTypes.any,
  };

  static defaultProps = {
    disabled: false,
    value: 'default',
  };

  render() {
    const { disabled, onChange, value } = this.props;
    return (
      <Select disabled={disabled} onChange={onChange} value={value} {...this.props}>
        <Select.Option value="default">Default</Select.Option>
        <Select.Option value="user">User</Select.Option>
      </Select>
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
export class ExperimentBranches extends React.PureComponent {
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
        <Button
          disabled={disabled}
          type="default"
          icon="plus"
          onClick={this.handleClickAdd}
          id="add-branch"
        >
          Add Branch
        </Button>
      </div>
    );
  }
}

@autobind
export class StringPreferenceField extends React.PureComponent {
  static propTypes = {
    onChange: PropTypes.func.isRequired,
  };

  handleChange(event) {
    const { onChange } = this.props;
    onChange(event.target.value.trim());
  }
  render() {
    const { onChange, ...other } = this.props;
    return (
      <Input
        onChange={this.handleChange}
        {...other}
      />
    );
  }
}

export class BooleanPreferenceField extends React.PureComponent {
  static propTypes = {
    value: PropTypes.bool,
  }

  static defaultProps = {
    value: null,
  }

  render() {
    return (
      <Radio.Group {...this.props}>
        <Radio.Button value={true} className="pref-true">
          <Icon type="check" /> True
        </Radio.Button>
        <Radio.Button value={false} className="pref-false">
          <Icon type="close" /> False
        </Radio.Button>
      </Radio.Group>
    );
  }
}

export class IntegerPreferenceField extends React.PureComponent {
  render() {
    return (
      <InputNumber {...this.props} />
    );
  }
}

@connectFormProps
@autobind
export class ExperimentBranchFields extends React.PureComponent {
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
