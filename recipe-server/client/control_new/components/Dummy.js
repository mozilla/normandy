import React from 'react';
import PropTypes from 'prop-types';

export default function Dummy({ text = 'world' }) {
  return (
    <div>Hello {text}.</div>
  );
}

Dummy.propTypes = {
  text: PropTypes.string,
};
