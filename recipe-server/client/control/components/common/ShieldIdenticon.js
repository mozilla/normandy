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

    // If the image is already `complete` then it was probably loaded from cache,
    // and we don't need to display the loading spinner
    if (this.imgInstance.complete) {
      this.onImageSuccessfulLoad();
    } else {
      // If the image needs to load, register some handlers to check if/when
      // the thing loads, so we know whether to display the loading state or not.
      this.handleLoadingImage();

      // Wait for a few ms before displaying the loading spinner. This prevents
      // a quick flash/jump of the spinner for images that load quickly, but
      // appropriately displays the loading state for slower connections.
      this.loadTimer = setTimeout(() => {
        this.setState({ isLoading: true });
      }, ShieldIdenticon.loadWaitTime);
    }
  }

  onImageSuccessfulLoad() {
    this.setState({ isLoading: false });
    this.clearLoadingHandlers();
  }

  clearLoadingHandlers() {
    clearTimeout(this.loadTimer);
    clearTimeout(this.checkTimer);
    if (this.imgInstance) {
      this.imgInstance.onload = () => {};
    }
  }

  handleLoadingImage() {
    this.imgInstance.onload = this.onImageSuccessfulLoad;

    this.runCheckTimer();
  }

  // Use a timer to periodically check if the image is loaded, in the event we
  // don't bind `onload` in time or something.
  runCheckTimer() {
    clearTimeout(this.checkTimer);

    this.checkTimer = setTimeout(() => {
      if (this.imgInstance.complete) {
        this.onImageSuccessfulLoad();
      } else {
        this.runCheckTimer();
      }
    }, 250);
  }

  render() {
    const { seed, size, className } = this.props;
    const { isLoading } = this.state;

    if (typeof seed === 'undefined') {
      return null;
    }

    // In order to prevent the page showing the alt text while the image is
    // loading, we'll hide it from the user until it has loaded.
    const imgStyle = { height: 0, width: 0, position: 'absolute' };

    const containerStyle = {
      height: `${size}px`,
      width: `${size}px`,
    };

    return (
      <span style={containerStyle} className={cx(className, 'shield-container')}>
        { isLoading && <Spin size="small" /> }
        <img
          alt="Shield Identicon"
          height={size}
          key={seed}
          ref={this.onImageMount}
          src={`/api/v2/identicon/${seed}.svg`}
          style={isLoading ? imgStyle : {}}
          width={size}
        />
      </span>
    );
  }
}
