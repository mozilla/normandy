import React from 'react';

export default function CheckboxField({ label, field, containerClass }) {
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
}
