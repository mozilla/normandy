import React, { PropTypes as pt } from 'react';
import NumberField from 'control/components/form_fields/NumberField';

const SelectMenu = props => {
  const { options, onChange, field } = props;
  return (
    <select {...field} onChange={onChange}>
      <option>Select...</option>
      {options.map(name => <option key={name} value={name}>{name}</option>)}
    </select>
  );
};
SelectMenu.propTypes = {
  options: pt.object.isRequired,
  onChange: pt.func,
  field: pt.object.isRequired,
};

const FormField = props => {
  const { label, type, field, containerClass } = props;
  let fieldType;
  // in some instances (checkbox) we want to nest the label
  // so that the input and the text appear inline
  let nestInputInLabel = false;

  switch (type) {
    case 'select':
      fieldType = (<SelectMenu {...props} />);
      break;
    case 'text':
      fieldType = (<input type="text" field={field} {...field} />);
      break;
    case 'number':
      fieldType = (<NumberField {...props} />);
      break;
    case 'textarea':
      fieldType = (<textarea field={field} {...field} />);
      break;
    case 'checkbox':
      fieldType = (<input type="checkbox" {...field} />);
      nestInputInLabel = true;
      break;
    default:
      throw new Error(`Unexpected field type: "${type}"`);
  }

  return (
    <div className="row">
      <div className={containerClass}>
        <label htmlFor={field.name}>
          {nestInputInLabel && fieldType}
          {label}
          <span className="validation-error">{field.error}</span>
        </label>
        {!nestInputInLabel && fieldType}
      </div>
    </div>
  );
};
FormField.propTypes = {
  label: pt.string.isRequired,
  type: pt.string.isRequired,
  field: pt.object.isRequired,
  containerClass: pt.string.isRequired,
};
FormField.defaultProps = {
  type: 'text',
};

export default FormField;
