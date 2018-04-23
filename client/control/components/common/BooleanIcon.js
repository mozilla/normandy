import { Icon } from 'antd';
import PropTypes from 'prop-types';
import React from 'react';


export default class BooleanIcon extends React.PureComponent {
  static propTypes = {
    value: PropTypes.bool.isRequired,
  };

  render() {
    const { value } = this.props;
    const type = value ? 'check' : 'close';
    const booleanClass = value ? 'is-true' : 'is-false';
    return <Icon className={`boolean-icon ${booleanClass}`} type={type} />;
  }
}
