import { Button, Form, Input, Select } from 'antd';
import autobind from 'autobind-decorator';
import { is, Map } from 'immutable';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import FormItem from 'control_new/components/forms/FormItem';
import FormActions from 'control_new/components/forms/FormActions';
import ConsoleLogFields from 'control_new/components/recipes/ConsoleLogFields';
import PreferenceExperimentFields from 'control_new/components/recipes/PreferenceExperimentFields';
import ShowHeartbeatFields from 'control_new/components/recipes/ShowHeartbeatFields';
import { getAction, getAllActions } from 'control_new/state/actions/selectors';
import { areAnyRequestsInProgress } from 'control_new/state/requests/selectors';
import { createForm } from 'control_new/utils/forms';


/**
 * Form for editing recipes.
 */
@createForm({})
@connect(
  (state, props) => ({
    selectedAction: getAction(
      state,
      props.form.getFieldValue('action_id'),
      new Map(),
    ),
    isLoading: areAnyRequestsInProgress(state),
  }),
)
@autobind
export default class RecipeForm extends React.Component {
  static propTypes = {
    form: PropTypes.object.isRequired,
    isLoading: PropTypes.bool,
    onSubmit: PropTypes.func.isRequired,
    recipe: PropTypes.instanceOf(Map),
    selectedAction: PropTypes.instanceOf(Map).isRequired,
  };

  static defaultProps = {
    isLoading: false,
    recipe: new Map(),
  };

  static argumentsFields = {
    'console-log': ConsoleLogFields,
    'show-heartbeat': ShowHeartbeatFields,
    'preference-experiment': PreferenceExperimentFields,
  };

  componentWillReceiveProps(newProps) {
    // Initial values are mostly handled via props, but if the recipe
    // changes, we need to reset the values stored in the state.
    if (!is(newProps.recipe, this.props.recipe)) {
      this.props.form.resetFields();
    }
  }

  render() {
    const {
      isLoading,
      onSubmit,
      recipe,
      selectedAction,
    } = this.props;

    const ArgumentsFields = RecipeForm.argumentsFields[selectedAction.get('name')];

    return (
      <Form onSubmit={onSubmit}>
        <FormItem
          name="name"
          label="Name"
          initialValue={recipe.get('name')}
        >
          <Input disabled={isLoading} />
        </FormItem>
        <FormItem
          name="extra_filter_expression"
          label="Filter Expression"
          initialValue={recipe.get('extra_filter_expression')}
        >
          <Input disabled={isLoading} type="textarea" rows="4" />
        </FormItem>
        <FormItem
          name="action_id"
          label="Action"
          initialValue={recipe.getIn(['action', 'id'])}
        >
          <ActionSelect disabled={isLoading} />
        </FormItem>
        {ArgumentsFields && (
          <fieldset>
            <legend>Arguments</legend>
            <ArgumentsFields
              recipeArguments={recipe.get('arguments')}
              disabled={isLoading}
            />
          </fieldset>
        )}
        <FormActions>
          <FormActions.Primary>
            <Button type="primary" htmlType="submit" disabled={isLoading}>Save</Button>
          </FormActions.Primary>
        </FormActions>
      </Form>
    );
  }
}

@connect(
  state => ({
    actions: getAllActions(state, new Map()),
  }),
)
class ActionSelect extends React.Component {
  static propTypes = {
    actions: PropTypes.instanceOf(Map).isRequired,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  };

  static defaultProps = {
    value: null,
  };

  render() {
    const { actions, value, ...props } = this.props;

    // Select values have to be strings or else we get propType errors.
    const stringValue = value ? value.toString(10) : undefined;

    return (
      <Select placeholder="Select an action..." value={stringValue} {...props}>
        {actions.toList().map(action => (
          <Select.Option key={action.get('id')} value={action.get('id').toString(10)}>
            {action.get('name')}
          </Select.Option>
        ))}
      </Select>
    );
  }
}
