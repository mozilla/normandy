import React from 'react';
import PropTypes from 'prop-types';

export default class ShieldIdenticon extends React.PureComponent {
  static propTypes = {
    seed: PropTypes.string.isRequired,
    size: PropTypes.number,
  }

  static defaultProps = {
    size: 64,
  }

  render() {
    const { seed, size } = this.props;

    return (
      <img
        src={`/api/v2/identicon/v1:${seed}.svg`}
        height={size}
        width={size}
        alt="Shield Identicon"
      />
    );
  }
}
