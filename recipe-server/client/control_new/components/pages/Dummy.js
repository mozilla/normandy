import PropTypes from 'prop-types';
import React from 'react';

export default function Dummy({ text = 'world' }) {
  return (
    <div>Hello {text}.</div>
  );
}

Dummy.propTypes = {
  text: PropTypes.string,
};
