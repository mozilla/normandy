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


export const CheckboxGroup = ({ name, options = [], value, onChange }) => {
  const handleChange = option =>
    event => {
      const newValue = [...value];
      if (event.target.checked) {
        newValue.push(option.value);
      } else {
        newValue.splice(newValue.indexOf(option.value), 1);
      }

      return onChange(newValue);
    };

  return (
    <div>
      {
        options.map((option, index) =>
          <label className="checkbox" key={index}>
            <input
              type="checkbox"
              name={`${name}[${index}]`}
              value={option.value}
              checked={value.includes(option.value)}
              onChange={handleChange(option)}
            />
            {option.label}
          </label>)
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
