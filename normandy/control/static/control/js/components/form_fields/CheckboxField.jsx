import React from 'react';

const CheckboxField = (props) => {
  const {label, field, containerClass} = props;
  return (
    <div className="row">
      <div className={containerClass}>
        <label>
          <input type="checkbox" field={field} {...field} />
          {label}
        </label>
      </div>
    </div>
  );
};

export default CheckboxField;
