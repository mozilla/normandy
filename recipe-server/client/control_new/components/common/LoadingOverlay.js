import { Spin } from 'antd';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import { areAnyRequestsInProgress } from 'control_new/state/requests/selectors';


@connect(
  state => ({
    loading: areAnyRequestsInProgress(state),
  }),
)
export default class LoadingOverlay extends React.Component {
  static propTypes = {
    children: PropTypes.any,
    condition: PropTypes.bool,
    loading: PropTypes.bool.isRequired,
    useCondition: PropTypes.bool,
  };

  static defaultProps = {
    children: null,
    condition: false,
    useCondition: false,
  };

  render() {
    const {
      children,
      condition,
      loading,
      useCondition,
    } = this.props;

    // We can use a conditional expression instead of the global request state.
    const isCurrentlyLoading = useCondition ? condition : loading;

    const Wrapper = isCurrentlyLoading ? Spin : 'div';

    return (
      <Wrapper>
        {children}
      </Wrapper>
    );
  }
}
