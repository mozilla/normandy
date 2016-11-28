import { Component, PropTypes as pt } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import { requestAPIToken } from '../../actions/authActions.js';

class QueryAPIToken extends Component {
  static propTypes = {
    tokenFetching: pt.bool,
    token: pt.object,
    requestAPIToken: pt.func.isRequired,
  }

  componentWillMount() {
    this.request();
  }

  componentWillReceiveProps() {
    this.request();
  }

  request() {
    if (!this.props.tokenFetching && !this.props.token) {
      this.props.requestAPIToken();
    }
  }

  render() {
    return null;
  }
}


export default connect(
  state => ({
    tokenFetching: state.auth.requestInProgress,
    token: state.auth.token,
  }),
  dispatch => bindActionCreators({
    requestAPIToken,
  }, dispatch),
)(QueryAPIToken);
