import { Spin } from 'antd';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import { areAnyRequestsInProgress } from 'control_new/state/requests/selectors';


export class SimpleLoadingOverlay extends React.Component {
  static propTypes = {
    children: PropTypes.any,
    isVisible: PropTypes.bool,
  };

  static defaultProps = {
    children: null,
    isVisible: false,
  };

  render() {
    const {
      children,
      isVisible,
    } = this.props;

    const Wrapper = isVisible ? Spin : 'div';

    return (
      <Wrapper>
        {children}
      </Wrapper>
    );
  }
}


@connect(
  state => ({
    isLoading: areAnyRequestsInProgress(state),
  }),
)
export default class LoadingOverlay extends React.Component {
  static propTypes = {
    isLoading: PropTypes.bool.isRequired,
  };

  render() {
    return (
      <SimpleLoadingOverlay isVisible={this.props.isLoading} {...this.props} />
    );
  }
}
