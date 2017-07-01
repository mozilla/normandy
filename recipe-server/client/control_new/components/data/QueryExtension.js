import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import { fetchExtension } from 'control_new/state/extensions/actions';


class QueryExtension extends React.Component {
  static propTypes = {
    fetchExtension: PropTypes.func,
    pk: PropTypes.number.isRequired,
  }

  componentWillMount() {
    const { pk } = this.props;
    this.props.fetchExtension(pk);
  }

  componentWillReceiveProps(nextProps) {
    const { pk } = this.props;
    if (nextProps.pk && pk !== nextProps.pk) {
      this.props.fetchExtension(nextProps.pk);
    }
  }

  render() {
    return null;
  }
}


export default connect(
  null,
  dispatch => (bindActionCreators({
    fetchExtension,
  }, dispatch)),
)(QueryExtension);
