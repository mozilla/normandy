import React from 'react'
import FormField from '../form_fields/FormFieldWrapper.jsx';

class ConsoleLogForm extends React.Component {
  render() {
    const { fields } = this.props;
    return (
      <div>
        <p className="help row">Log a message to the console.</p>
        <FormField type="text" label="Message" field={fields.message} containerClass="fluid-3" />
      </div>
    )
  }
}

export default ConsoleLogForm;
