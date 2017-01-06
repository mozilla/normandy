import React, { PropTypes as pt } from 'react';

export default function CheckboxField({ label, field, containerClass }) {
  return (
    <div className="row">
      <div className={containerClass}>
        <label htmlFor={field.name}>
          <input type="checkbox" field={field} {...field} />
          {label}
        </label>
      </div>
    </div>
  );
}
CheckboxField.propTypes = {
  label: pt.string.isRequired,
  field: pt.object.isRequired,
  containerClass: pt.string,
};
