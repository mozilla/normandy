import React, { PropTypes as pt } from 'react';
import cx from 'classnames';

export default function Frame({ title, children, className }) {
  return (
    <fieldset className={cx('form-frame', className)}>
      {
        title &&
          <legend className="frame-title">
            { title }
          </legend>
      }

      { children }
    </fieldset>
  );
}

Frame.propTypes = {
  children: pt.node,
  className: pt.string,
  title: pt.string,
};
