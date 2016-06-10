import React from 'react'

class ConsoleLogForm extends React.Component {
  render() {
    const { fields } = this.props;
    return (
      <div>
        <div className="row">
          <p className="help fluid-4">Log a message to the console.</p>
        </div>
        <div className="row">
          <div className="fluid-3">
            <label>Message</label>
             <input type="text" field={fields.message} {...fields.message} />
          </div>
        </div>
      </div>
    )
  }
}

export default ConsoleLogForm;
