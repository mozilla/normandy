import React, { PropTypes as pt } from 'react';
import cx from 'classnames';

const displayFlavorText = (flav, index) =>
  <div key={index} children={flav} />;

export default function RecipeStatus(props) {
  const {
    icon,
    className,
    text,
    flavorText = [],
  } = props;

  return (
    <div className={cx('status-indicator', className)}>
      { icon }
      <div className="status-text">
        <span>{ text }</span>
        {
          !!flavorText.length &&
            <div className="flavor-text">
              { flavorText.map(displayFlavorText) }
            </div>
        }
      </div>
    </div>
  );
}
RecipeStatus.propTypes = {
  icon: pt.node,
  text: pt.string,
  className: pt.string,
  flavorText: pt.array,
};
