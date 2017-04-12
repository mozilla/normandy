import React, { PropTypes as pt } from 'react';
import cx from 'classnames';

const BooleanIcon = props => {
  const iconClass = props.value ? 'fa-check green' : 'fa-times red';
  return (
    <i title={props.title} className={cx('fa', 'fa-lg', iconClass, props.className)} />
  );
};

BooleanIcon.propTypes = {
  value: pt.bool.isRequired,
  title: pt.string,
  className: pt.string,
};

export default BooleanIcon;
