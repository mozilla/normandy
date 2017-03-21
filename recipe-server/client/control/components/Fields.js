import React, { PropTypes as pt } from 'react';
import { Field } from 'redux-form';

/**
 * redux-form Field component that wraps the form input in a label and error
 * message container.
 *
 * See buildControlField for supported props.
 */
export function ControlField({ component, ...args }) {
  return <Field component={buildControlField} InputComponent={component} {...args} />;
}
ControlField.propTypes = {
  component: pt.oneOfType([pt.func, pt.string]).isRequired,
};

/**
 * Builds the React component that is rendered for ControlField.
 */
export function buildControlField({
  input,
  meta: { error },
  label,
  className = '',
  InputComponent,
  children,
  wrapper = 'label',
  ...args // eslint-disable-line comma-dangle
}) {
  const WrappingElement = wrapper;
  return (
    <WrappingElement className={`${className} form-field`}>
      <span className="label">{label}</span>
      {error && <span className="error">{error}</span>}
      <InputComponent {...input} {...args}>
        {children}
      </InputComponent>
    </WrappingElement>
  );
}
buildControlField.propTypes = {
  input: pt.object.isRequired,
  meta: pt.shape({
    error: pt.string,
  }).isRequired,
  label: pt.string,
  wrapper: pt.oneOfType([pt.func, pt.string]),
  className: pt.string,
  InputComponent: pt.oneOfType([pt.func, pt.string]),
  children: pt.node,
};

export const CheckboxGroup = ({ name, onChange, options = [], value }) => {
  /**
   * Checkbox change event handler. Appends or removes the selected checkbox's
   * value to the existing `value` prop, and reports the change up to redux-form.
   *
   * @param  {Event} onChange event object
   */
  const handleChange = ({ event: target }) => {
    if (target.checked) {
      // Use Set to remove any dupes from the new value array
      const newValue = new Set(value.concat([target.value]));
      // Report an array up to redux-form
      onChange(Array.from(newValue));
    } else {
      // Remove this target's value from the array of values and return that array
      onChange(value.filter(val => val !== target.value));
    }
  };

  /**
   * Render the full list of inputs
   */
  return (
    <div>
      {
        options.map((option, index) =>
          <label className="checkbox" key={index}>
            <input
              type="checkbox"
              name={name}
              value={option.value}
              checked={value.includes(option.value)}
              onChange={handleChange}
            />
            <span>{option.label}</span>
          </label>
        )
      }
    </div>
  );
};

CheckboxGroup.propTypes = {
  name: pt.string.isRequired,
  input: pt.object.isRequired,
  value: pt.oneOfType([pt.string, pt.array]),
  onChange: pt.func.isRequired,
  options: pt.array,
};
