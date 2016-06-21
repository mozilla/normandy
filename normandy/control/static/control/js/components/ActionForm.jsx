import React from 'react'
import { reduxForm } from 'redux-form'
import HeartbeatForm, { HeartbeatFormFields } from './action_forms/HeartbeatForm.jsx'
import ConsoleLogForm, { ConsoleLogFormFields } from './action_forms/ConsoleLogForm.jsx'
import FeatureRecommendationForm, { FeatureRecommendationFormFields } from './action_forms/FeatureRecommendationForm.jsx'

export class ActionForm extends React.Component {
  render() {
    const { fields, name, ChildForm } = this.props;

    return (
      <div id="action-configuration">
        <i className="fa fa-caret-up fa-lg"></i>
        <ChildForm fields={fields} />
      </div>
    )
  }
}

export default reduxForm({
    form: 'action',
  }, (state, props) => {
    let initialValues = {};
    let fields = [];
    let ChildForm = null;

    switch(props.name) {
      case 'show-heartbeat':
        ChildForm = HeartbeatForm;
        fields = HeartbeatFormFields;
        break;
      case 'console-log':
        ChildForm = ConsoleLogForm;
        fields = ConsoleLogFormFields;
        break;
      case 'feature-recommendation':
        ChildForm = FeatureRecommendationForm;
        fields = FeatureRecommendationFormFields;
        break;
    }

    if (props.recipe && props.recipe.action === props.name) {
      initialValues = props.recipe['arguments'];
    }

    return {
      initialValues,
      fields,
      ChildForm
    }
})(ActionForm)
