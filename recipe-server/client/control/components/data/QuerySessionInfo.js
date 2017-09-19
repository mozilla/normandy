import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import {
  fetchSessionInfo as fetchSessionInfoAction,
} from 'control/state/app/session/actions';


@connect(
  null,
  {
    fetchSessionInfo: fetchSessionInfoAction,
  },
)
export default class QuerySessionInfo extends React.PureComponent {
  static propTypes = {
    fetchSessionInfo: PropTypes.func.isRequired,
  }

  componentWillMount() {
    this.props.fetchSessionInfo();
  }

  render() {
    return null;
  }
}
