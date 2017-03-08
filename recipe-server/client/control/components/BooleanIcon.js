import React, { PropTypes as pt } from 'react';


const BooleanIcon = props => {
  const iconClass = props.value ? 'fa-check green' : 'fa-times red';
  return <i className={`fa fa-lg ${iconClass}`}>&nbsp;</i>;
};

BooleanIcon.propTypes = {
  value: pt.bool.isRequired,
};

export default BooleanIcon;
