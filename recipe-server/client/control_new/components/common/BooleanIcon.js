import { Icon } from 'antd';
import PropTypes from 'prop-types';
import React from 'react';


export default function BooleanIcon({ value }) {
  const type = value ? 'check' : 'close';
  const booleanClass = value ? 'is-true' : 'is-false';
  return <Icon className={`boolean-icon ${booleanClass}`} type={type} />;
}

BooleanIcon.propTypes = {
  value: PropTypes.bool,
};
