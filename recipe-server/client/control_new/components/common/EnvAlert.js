import { Alert } from 'antd';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

/**
 * Simple component which tells the user whether they are viewing a dev or staging
 * environment. On production, nothing is shown.
 */
@connect(() => ({
  currentUrl: window.location.href,
}))
export default class EnvAlert extends React.PureComponent {
  static propTypes = {
    currentUrl: PropTypes.string.isRequired,
  };

  static productionFragments = ['normandy-admin.prod.'];
  static stageFragments = ['normandy-admin.stage.'];

  static learnMoreLink = (
    <a
      href="http://normandy.readthedocs.io/en/latest/qa/environments.html"
      target="_blank"
      rel="noopener noreferrer"
    >
      Learn more about Normandy environments.
    </a>);

  /**
   * Given a URL and an array of strings, determines if that URL contains at least
   * one of the strings.
   *
   * @param  {String}        url       URL to search over.
   * @param  {Array<String>} fragments Collection of strings to find in the URL.
   * @return {Boolean}                 True if URL contains at least one fragment.
   */
  static findFragmentsInURL(url, fragments) {
    return !!fragments.find(piece => url.indexOf(piece) > -1);
  }

  static checkProduction(url) {
    return EnvAlert.findFragmentsInURL(url, EnvAlert.productionFragments);
  }

  static checkStaging(url) {
    return EnvAlert.findFragmentsInURL(url, EnvAlert.stageFragments);
  }

  render() {
    const { currentUrl } = this.props;

    // Never show this component when on production.
    if (EnvAlert.checkProduction(currentUrl)) {
      return null;
    }

    const isStaging = EnvAlert.checkStaging(currentUrl);

    // If we're here and not on staging, we must be on a development env.
    const currEnv = isStaging ? 'staging' : 'development';

    const message = `You are viewing a ${currEnv} environment.`;

    return (
      <Alert
        banner
        closable
        description={EnvAlert.learnMoreLink}
        message={message}
        type="warning"
        showIcon
      />
    );
  }
}
