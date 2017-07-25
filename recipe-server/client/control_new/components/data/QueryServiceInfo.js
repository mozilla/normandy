import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import { fetchServiceInfo } from 'control_new/state/app/serviceInfo/actions';


@connect(
  null,
  {
    fetchServiceInfo,
  },
)
export default class QueryServiceInfo extends React.Component {
  static propTypes = {
    fetchServiceInfo: PropTypes.func.isRequired,
  }

  componentWillMount() {
    this.props.fetchServiceInfo();
  }

  render() {
    return null;
  }
}
