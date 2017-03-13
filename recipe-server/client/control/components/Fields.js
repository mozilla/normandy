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
  hideErrors = false,
  children,
  ...args // eslint-disable-line comma-dangle
}) {
  const WrappingElement = label ? 'label' : 'div';
  return (
    <WrappingElement className={`${className} form-field`}>
      <span className="label">{label}</span>
      {!hideErrors && error && <span className="error">{error}</span>}
      <InputComponent {...input} {...args} input={input}>
        {children}
      </InputComponent>
    </WrappingElement>
  );
}
buildControlField.propTypes = {
  input: pt.object.isRequired,
  meta: pt.shape({
    error: pt.oneOfType([pt.string, pt.array]),
  }).isRequired,
  label: pt.string,
  className: pt.string,
  InputComponent: pt.oneOfType([pt.func, pt.string]),
  hideErrors: pt.bool,
  children: pt.node,
};

export class IntegerControlField extends React.Component {
  parse(value) {
    return Number.parseInt(value, 10);
  }

  render() {
    return (
      <ControlField
        component="input"
        type="number"
        step="1"
        parse={this.parse}
        {...this.props}
      />
    );
  }
}

export class BooleanRadioControlField extends React.Component {
  parse(value) {
    return value === 'true';
  }

  format(value) {
    if (value) {
      return 'true';
    } else if (value !== undefined) {
      return 'false';
    }
    return undefined;
  }

  render() {
    return (
      <ControlField
        component="input"
        type="radio"
        className="radio-field"
        parse={this.parse}
        format={this.format}
        {...this.props}
      />
    );
  }
}

export function ErrorMessageField(props) {
  return <Field component={buildErrorMessageField} {...props} />;
}

export function buildErrorMessageField({ meta: { error } }) {
  if (error) {
    return <span className="error">{error}</span>;
  }
  return null;
}
buildErrorMessageField.propTypes = {
  meta: pt.shape({
    error: pt.oneOfType([pt.string, pt.array]),
  }).isRequired,
};


export const CheckboxGroup = ({ name, options = [], input }) =>
  <div>
    {
      options.map((option, index) =>
        <div className="checkbox" key={index}>
          <input
            type="checkbox"
            name={`${name}[${index}]`}
            value={option.value}
            checked={input.value.indexOf(option.value) !== -1}
            onChange={event => {
              const newValue = [...input.value];
              if (event.target.checked) {
                newValue.push(option.value);
              } else {
                newValue.splice(newValue.indexOf(option.value), 1);
              }

              return input.onChange(newValue);
            }}
          />
          {option.value}
        </div>)
    }
  </div>;

CheckboxGroup.propTypes = {
  name: pt.string.isRequired,
  input: pt.object.isRequired,
  options: pt.array,
};
