import { Button, Form, Input, Select } from 'antd';
import autobind from 'autobind-decorator';
import { is, Map } from 'immutable';
import pt from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import { createForm, FormItem } from 'control_new/components/common/forms';
import FormActions from 'control_new/components/common/FormActions';
import ConsoleLogFields from 'control_new/components/recipes/ConsoleLogFields';
import PreferenceExperimentFields from 'control_new/components/recipes/PreferenceExperimentFields';
import ShowHeartbeatFields from 'control_new/components/recipes/ShowHeartbeatFields';
import { getAction, getAllActions } from 'control_new/state/actions/selectors';


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
  }),
)
@autobind
export default class RecipeForm extends React.Component {
  static propTypes = {
    recipe: pt.instanceOf(Map),
    form: pt.object,
    onSubmit: pt.func,
    selectedAction: pt.instanceOf(Map),
  }

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
    const { onSubmit, recipe = new Map(), selectedAction } = this.props;
    const ArgumentsFields = RecipeForm.argumentsFields[selectedAction.get('name')];

    return (
      <Form onSubmit={onSubmit}>
        <FormItem
          name="name"
          label="Name"
          initialValue={recipe.get('name')}
        >
          <Input />
        </FormItem>
        <FormItem
          name="extra_filter_expression"
          label="Filter Expression"
          initialValue={recipe.get('extra_filter_expression')}
        >
          <Input type="textarea" rows="4" />
        </FormItem>
        <FormItem
          name="action_id"
          label="Action"
          initialValue={recipe.getIn(['action', 'id']).toString(10)}
        >
          <ActionSelect />
        </FormItem>
        {ArgumentsFields && (
          <fieldset>
            <legend>Arguments</legend>
            <ArgumentsFields
              recipeArguments={recipe.get('arguments')}
            />
          </fieldset>
        )}
        <FormActions>
          <FormActions.Primary>
            <Button type="primary" htmlType="submit">Save</Button>
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
    actions: pt.instanceOf(Map).isRequired,
    value: pt.string,
  }

  render() {
    const { actions, value, ...props } = this.props;

    // Select values have to be strings or else we get propType errors.
    const stringValue = value ? value.toString(10) : undefined;

    return (
      <Select placeholder="Select an action..." value={stringValue} {...props}>
        {actions.toList().map(action =>
          <Select.Option key={action.get('id')} value={action.get('id').toString(10)}>
            {action.get('name')}
          </Select.Option>
        )}
      </Select>
    );
  }
}
