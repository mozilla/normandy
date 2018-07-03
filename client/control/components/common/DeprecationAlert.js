import { Alert } from 'antd';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import { getFullyQualifiedCurrentURL } from 'control/state/router/selectors';

const ENV_PROD = 'ENV_PROD';
const ENV_STAGE = 'ENV_STAGE';
const ENV_DEV = 'ENV_DEV';

const DC_URLS = {
  [ENV_PROD]: 'https://delivery-console.prod.mozaws.net/',
  [ENV_STAGE]: 'https://delivery-console.stage.mozaws.net/',
  [ENV_DEV]: 'https://delivery-console.dev.mozaws.net/',
};

/**
 * Simple component which tells the user that the current UI is deperecated.
 */
@connect(state => ({
  currentUrl: getFullyQualifiedCurrentURL(state)
}))
export default class DeprecationAlert extends React.PureComponent {
  static propTypes = {
    currentUrl: PropTypes.string.isRequired,
  };

  static productionFragments = ['normandy-admin.prod.'];
  static stageFragments = ['normandy-admin.stage.'];

  /**
   * Given a URL and an array of strings, determines if that URL contains at least
   * one of the strings.
   *
   * @param  {String}        url       URL to search over.
   * @param  {Array<String>} fragments Collection of strings to find in the URL.
   * @return {Boolean}                 True if URL contains at least one fragment.
   */
  static findFragmentsInURL(url, fragments) {
    return !!fragments.find(piece => url.includes(piece));
  }

  static checkProduction(url) {
    return DeprecationAlert.findFragmentsInURL(url, DeprecationAlert.productionFragments);
  }

  static checkStaging(url) {
    return DeprecationAlert.findFragmentsInURL(url, DeprecationAlert.stageFragments);
  }

  detectEnv() {
    const { currentUrl } = this.props;

    if (DeprecationAlert.checkProduction(currentUrl)) {
      return ENV_PROD;
    } else if (DeprecationAlert.checkProduction(currentUrl)) {
      return ENV_STAGE;
    }

    return ENV_DEV;
  }

  renderDescription() {
    const url = DC_URLS[this.detectEnv()];
    return (
      <a href={url} target="_blank" rel="noopener noreferrer">
        Open Delivery Console.
      </a>
    );
  }

  render() {
    const message = 'This UI has been deprecated. You should only use it if you are experiencing issues with Delivery Console.';

    return (
      <Alert
        banner
        closable
        description={this.renderDescription()}
        message={message}
        type="error"
        showIcon
      />
    );
  }
}
