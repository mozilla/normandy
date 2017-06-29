import { Spin } from 'antd';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import { areAnyRequestsInProgress } from 'control_new/state/requests/selectors';


@connect(
  state => ({
    loading: areAnyRequestsInProgress(state) || false,
  })
)
export default class LoadingOverlay extends React.Component {
  static propTypes = {
    children: PropTypes.any,
    loading: PropTypes.bool.isRequired,
  }

  render() {
    const { children, loading } = this.props;
    const Wrapper = loading ? Spin : 'div';
    return (
      <Wrapper>
        {children}
      </Wrapper>
    );
  }
}
