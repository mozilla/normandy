import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import { fetchAllActions } from 'control_new/state/actions/actions';


class QueryActions extends React.Component {
  static propTypes = {
    fetchAllActions: PropTypes.func.isRequired,
  }

  componentWillMount() {
    this.props.fetchAllActions();
  }

  render() {
    return null;
  }
}


export default connect(
  null,
  dispatch => (bindActionCreators({
    fetchAllActions,
  }, dispatch)),
)(QueryActions);
