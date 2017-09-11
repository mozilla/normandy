import React from 'react';
import PropTypes from 'prop-types';

export default class ShieldIdenticon extends React.PureComponent {
  static propTypes = {
    seed: PropTypes.string.isRequired,
    size: PropTypes.number,
    className: PropTypes.string,
  };

  static defaultProps = {
    size: 64,
    className: null,
  };

  render() {
    const { seed, size, className } = this.props;

    if (typeof seed === 'undefined') {
      return null;
    }

    return (
      <img
        className={className}
        src={`/api/v2/identicon/${seed}.svg`}
        height={size}
        width={size}
        alt="Shield Identicon"
      />
    );
  }
}
