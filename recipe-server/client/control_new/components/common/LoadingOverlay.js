import { Spin } from 'antd';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import {
  areAnyRequestsInProgress,
  isRequestInProgress,
} from 'control_new/state/app/requests/selectors';


export class SimpleLoadingOverlay extends React.PureComponent {
  static propTypes = {
    children: PropTypes.any,
    className: PropTypes.string,
    isVisible: PropTypes.bool,
  };

  static defaultProps = {
    children: null,
    className: null,
    isVisible: false,
  };

  render() {
    const {
      children,
      className,
      isVisible,
    } = this.props;

    const Wrapper = isVisible ? Spin : 'div';

    return (
      <Wrapper className={className}>
        {children}
      </Wrapper>
    );
  }
}


@connect(
  (state, { requestIds }) => {
    let isLoading;

    // If we're given one or more request IDs, check if at least one is in progress.
    // If nothing is given, simply check if _any_ request is in progress.
    if (requestIds) {
      let requestArray = requestIds;
      if (!(requestArray instanceof Array)) {
        requestArray = [requestIds];
      }

      isLoading = !!requestArray.find(reqId => isRequestInProgress(state, reqId));
    } else {
      isLoading = areAnyRequestsInProgress(state);
    }

    return {
      isLoading,
    };
  },
)
export default class LoadingOverlay extends React.PureComponent {
  static propTypes = {
    isLoading: PropTypes.bool.isRequired,
    requestIds: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.string), PropTypes.string]),
  };

  static defaultProps = {
    requestIds: null,
  };

  render() {
    return (
      <SimpleLoadingOverlay isVisible={this.props.isLoading} {...this.props} />
    );
  }
}
