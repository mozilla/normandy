// eslint flags our `onClick` as an accessibility issue, but the Switch already
// handles user focus etc.
/* eslint-disable jsx-a11y/interactive-supports-focus */

import { Switch } from 'antd';
import autobind from 'autobind-decorator';
import PropTypes from 'prop-types';
import React from 'react';

@autobind
export default class SwitchBox extends React.Component {
  static propTypes = {
    children: PropTypes.node,
    onChange: PropTypes.func.isRequired,
    value: PropTypes.any,
  };

  static defaultProps = {
    children: null,
    value: null,
  };

  handleClick() {
    const newValue = !this.props.value;

    this.props.onChange(newValue);
  }

  render() {
    const {
      value,
      children,
      ...rest
    } = this.props;


    return (
      <label className="switchbox">
        <Switch
          {...rest}
          checked={value}
        />

        {
          children &&
            <span
              className="label"
              onClick={this.handleClick}
              role="checkbox"
              aria-checked={value}
            >
              { children }
            </span>
        }
      </label>
    );
  }
}
