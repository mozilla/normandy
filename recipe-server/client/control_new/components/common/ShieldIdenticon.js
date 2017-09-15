import { Spin } from 'antd';
import autobind from 'autobind-decorator';
import React from 'react';
import PropTypes from 'prop-types';

@autobind
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

  static loadWaitTime = 100; // ms

  state = {
    isLoading: false,
  };

  componentWillUnmount() {
    clearTimeout(this.loadTimer);
    if (this.imgInstance) {
      this.imgInstance.onload = () => {};
    }
  }

  onImageMount(img) {
    if (!img) {
      return;
    }

    this.imgInstance = img;

    // If the image has already been loaded (via cache) then skip the loading UI logic.
    if (this.imgInstance.complete) {
      return;
    }

    this.loadTimer = setTimeout(() => {
      // If the image has not loaded by now, display the loading spinner and hook
      // into the image's `onload` event.
      if (!this.imgInstance.complete) {
        this.showLoadingState();
      }
    }, ShieldIdenticon.loadWaitTime);
  }

  showLoadingState() {
    this.setState({
      isLoading: true,
    });

    this.imgInstance.onload = () => {
      this.setState({
        isLoading: false,
      });
    };
  }

  render() {
    const { seed, size, className } = this.props;

    if (typeof seed === 'undefined') {
      return null;
    }

    // In order to prevent the the page jumping while the image is loading, we'll
    // squish and hide it until it has loaded.
    const imgStyle = { height: 0, width: 0, position: 'absolute' };

    return (
      <span>
        { this.state.isLoading && <Spin size="small" className={className} /> }
        <img
          ref={this.onImageMount}
          className={className}
          src={`/api/v2/identicon/${seed}.svg`}
          height={size}
          width={size}
          alt="Shield Identicon"
          style={this.state.isLoading ? imgStyle : {}}
        />
      </span>
    );
  }
}
