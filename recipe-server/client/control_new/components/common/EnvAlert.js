import { Alert } from 'antd';
import React from 'react';

/**
 * Simple component which tells the user whether they are viewing a dev or staging
 * environment. On production, nothing is shown.
 */
export default class EnvAlert extends React.PureComponent {
  static productionUrls = ['normandy-admin.prod.'];
  static stageUrls = ['normandy-admin.stage.'];

  static learnMoreLink = (
    <a
      href="http://normandy.readthedocs.io/en/latest/qa/environments.html"
      target="_blank"
      rel="noopener noreferrer"
    >
      Learn more about Normandy environments.
    </a>);

  /**
   * Find a string fragment in an array of strings.
   *
   * @param  {String}        needle   String fragment to find.
   * @param  {Array<String>} haystack String collection to search.
   * @return {Boolean}                Was the fragment found?
   */
  static findPartialString(needle, haystack) {
    return !!haystack.find(straw => straw.indexOf(needle) > -1);
  }

  static checkProduction(url) {
    return EnvAlert.findPartialString(url, EnvAlert.productionUrls);
  }

  static checkStaging(url) {
    return EnvAlert.findPartialString(url, EnvAlert.stageUrls);
  }

  render() {
    const currentUrl = window.location.href;

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
