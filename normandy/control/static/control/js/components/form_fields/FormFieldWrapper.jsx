import React from 'react'

const SelectMenu = (props) => {
  const { options, onChange, field } = props;
  return (
    <select {...field} onChange={onChange}>
      <option>Select...</option>
      { options.map(name => <option key={name} value={name}>{name}</option>) }
    </select>
  )
}

const FormField = (props) => {
  const { label, type, field, containerClass } = props;
  let fieldType = "Unrenderable form field";

  switch(type) {
    case 'select':
      fieldType = (<SelectMenu {...props} />);
      break;
    case 'text':
      fieldType = (<input type="text" field={field} {...field} />);
      break;
    case 'textarea':
      fieldType = (<textarea field={field} {...field} />);
      break;
  }

  return (
    <div className="row">
      <div className={containerClass}>
        <label>{label}</label>
        {fieldType}
      </div>
    </div>
  )
}

export default FormField;
