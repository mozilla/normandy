import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import { fetchExtension } from 'control_new/state/extensions/actions';


@connect(
  null,
  {
    fetchExtension,
  },
)
export default class QueryExtension extends React.Component {
  static propTypes = {
    fetchExtension: PropTypes.func.isRequired,
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
