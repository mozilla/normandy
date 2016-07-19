import React, { PropTypes as pt } from 'react';

export default class NumberField extends React.Component {
  static propTypes = {
    field: pt.object.isRequired,
    normalize: pt.func,
    onBlur: pt.func,
    onChange: pt.func,
  }

  static defaultProps = {
    normalize: value => value && parseInt(value, 10),
  }

  /* Swallow redux-form's onBlur() so it doesn't reset value to string */
  handleBlur() {
    if (this.props.onBlur) {
      this.props.onBlur();
    }
  }

  /* Trigger redux-form's onChange() after parsing value to integer */
  handleChange(event) {
    const { normalize, field } = this.props;
    const value = event.target.value;

    field.onChange(normalize(value));
  }

  render() {
    const { field } = this.props;

    return (
      <input
        type="number"
        {...field}
        onBlur={::this.handleBlur}
        onChange={::this.handleChange}
      />
    );
  }
}
