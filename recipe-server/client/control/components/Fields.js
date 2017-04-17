import React, { PropTypes as pt } from 'react';
import { Field } from 'redux-form';
import { uniq } from 'underscore';

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
      {label && <span className="label">{label}</span>}
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

export class CheckboxGroup extends React.Component {
  static propTypes = {
    name: pt.string.isRequired,
    onChange: pt.func.isRequired,
    options: pt.array.isRequired,
    value: pt.arrayOf(pt.string),
  };

  constructor(props) {
    super(props);
    this.state = {};

    this.handleChange = ::this.handleChange;
    this.renderOption = ::this.renderOption;
  }

  /**
   * Checkbox change event handler. Appends or removes the selected checkbox's
   * value to the existing `value` prop, and reports the change up to redux-form.
   *
   * @param  {Event} onChange event object
   */
  handleChange({ target }) {
    const {
      value = [],
      onChange,
    } = this.props;

    let newValue = [];

    if (target.checked) {
      newValue = uniq(value.concat([target.value]));
    } else {
      newValue = value.filter(val => val !== target.value);
    }

    onChange(newValue);
  }

  renderOption(option, index) {
    const {
      name,
      value = [],
    } = this.props;

    return (
      <label className="checkbox" key={index}>
        <input
          type="checkbox"
          name={name}
          value={option.value}
          checked={value.includes(option.value)}
          onChange={this.handleChange}
        />
        <span>{option.label}</span>
      </label>
    );
  }

  render() {
    const {
      options = [],
    } = this.props;

    return (
      <div className="checkbox-list">
        { options.map(this.renderOption) }
      </div>
    );
  }
}
