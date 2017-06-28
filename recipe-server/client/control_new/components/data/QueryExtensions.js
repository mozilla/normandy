import React, { PropTypes as pt } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import { fetchAllExtensions } from 'control_new/state/extensions/actions';


class QueryExtensions extends React.Component {
  static propTypes = {
    fetchAllExtensions: pt.func,
  }

  componentWillMount() {
    this.props.fetchAllExtensions();
  }

  render() {
    return null;
  }
}


export default connect(
  null,
  dispatch => (bindActionCreators({
    fetchAllExtensions,
  }, dispatch)),
)(QueryExtensions);
