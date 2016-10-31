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
  ...args // eslint-disable-line comma-dangle
}) {
  return (
    <label className={`${className} form-field`}>
      <span className="label">{label}</span>
      {error && <span className="error">{error}</span>}
      <InputComponent {...input} {...args}>
        {children}
      </InputComponent>
    </label>
  );
}
buildControlField.propTypes = {
  input: pt.object.isRequired,
  meta: pt.shape({
    error: pt.string,
  }).isRequired,
  label: pt.string.isRequired,
  className: pt.string,
  InputComponent: pt.oneOfType([pt.func, pt.string]),
  children: pt.node,
};
