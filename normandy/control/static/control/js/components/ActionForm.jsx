import React from 'react'
import { reduxForm } from 'redux-form'
import { _ } from 'underscore'
import HeartbeatForm from './action_forms/HeartbeatForm.jsx'
import ConsoleLogForm from './action_forms/ConsoleLogForm.jsx'

class ActionForm extends React.Component {
  constructor(props) {
    super(props)
  }

  shouldComponentUpdate(nextProps, nextState) {
    const currentProps = _.pick(this.props, 'initialValues', 'values', 'fields', 'selectedAction');
    const incomingProps = _.pick(nextProps, 'initialValues', 'values', 'fields', 'selectedAction');

    return (!_.isEqual(currentProps, incomingProps) || !_.isEqual(this.state, nextState));
  }

  render() {
    const { fields, arguments_schema, recipe, name } = this.props;

    let childForm = 'No action form available';

    switch(name) {
      case 'show-heartbeat':
        childForm = (<HeartbeatForm fields={fields} />);
        break;
      case 'console-log':
        childForm = (<ConsoleLogForm fields={fields} />);
        break;
      default:
        childForm = childForm;
    }

    return (
      <div id="action-configuration">
        <i className="fa fa-caret-up fa-lg"></i>
        <div className="row">
          <p className="help fluid-4">{arguments_schema.description || arguments_schema.title }</p>
        </div>
        {childForm}
      </div>
    )
  }
}

export default reduxForm({
    form: 'action',
  }, (state, props) => {
    let initialValues = {};
    if (props.recipe && props.recipe.action_name === props.name) {
      initialValues = props.recipe['arguments'];
    }

    return {
      initialValues
    }
})(ActionForm)
