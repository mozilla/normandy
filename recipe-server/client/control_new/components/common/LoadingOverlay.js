import { Spin } from 'antd';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import { areAnyRequestsInProgress } from 'control_new/state/requests/selectors';


export class SimpleLoadingOverlay extends React.Component {
  static propTypes = {
    children: PropTypes.any,
    visible: PropTypes.bool,
  };

  static defaultProps = {
    children: null,
    visible: false,
  };

  render() {
    const {
      children,
      visible,
    } = this.props;

    const Wrapper = visible ? Spin : 'div';

    return (
      <Wrapper>
        {children}
      </Wrapper>
    );
  }
}


@connect(
  state => ({
    loading: areAnyRequestsInProgress(state),
  }),
)
export default class LoadingOverlay extends React.Component {
  static propTypes = {
    loading: PropTypes.bool.isRequired,
  };

  render() {
    return (
      <SimpleLoadingOverlay visible={this.props.loading} {...this.props} />
    );
  }
}
