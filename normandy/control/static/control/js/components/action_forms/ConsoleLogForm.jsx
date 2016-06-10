import React from 'react'

class ConsoleLogForm extends React.Component {
  render() {
    const { fields } = this.props;
    return (
      <div className="row">
        <div className="fluid-3">
          <label>Message</label>
           <input type="text" field={fields.message} {...fields.message} />
        </div>
      </div>
    )
  }
}

export default ConsoleLogForm;
