import React from 'react'

class ConsoleLogForm extends React.Component {
  constructor(props) {
    super(props)
  }

  render() {
    const { fields } = this.props;
    return (
      <div className="row">
        {
          Object.keys(fields).map(fieldName => {
            return (
              <div key={fieldName} className="fluid-3">
                <label>{fieldName}</label>
                 <input type="text" field={fields[fieldName]} {...fields[fieldName]} />
              </div>
            )
          })
        }
      </div>
    )
  }
}

export default ConsoleLogForm;
