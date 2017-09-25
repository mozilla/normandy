import { Spin } from 'antd';
import autobind from 'autobind-decorator';
import cx from 'classnames';
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
    isLoading: true,
  };

  componentWillUnmount() {
    this.clearLoadingHandlers();
  }

  onImageMount(img) {
    if (!img) {
      return;
    }

    // If we have an image already but a new one has been mounted, we need to
    // clear the previous loading timer/handlers.
    if (this.imgInstance && this.imgInstance !== img) {
      this.clearLoadingHandlers();
    }

    this.imgInstance = img;

    // If the image has already been loaded (via cache) then skip the loading UI logic.
    if (this.imgInstance.complete) {
      this.setState({
        isLoading: false,
      });
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

  clearLoadingHandlers() {
    clearTimeout(this.loadTimer);
    if (this.imgInstance) {
      this.imgInstance.onload = () => {};
    }
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

    // In order to prevent the page showing the alt text while the image is loading,
    // we'll hide it from the user until it has loaded.
    const imgStyle = { height: 0, width: 0, position: 'absolute' };

    const containerStyle = {
      height: `${size}px`,
      width: `${size}px`,
    };

    return (
      <span style={containerStyle} className={cx(className, 'shield-container')}>
        { this.state.isLoading && <Spin size="small" /> }
        <img
          alt="Shield Identicon"
          height={size}
          key={seed}
          ref={this.onImageMount}
          src={`/api/v2/identicon/${seed}.svg`}
          style={this.state.isLoading ? imgStyle : {}}
          width={size}
        />
      </span>
    );
  }
}
