import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import { fetchExtension } from 'control/state/app/extensions/actions';


@connect(
  null,
  {
    fetchExtension,
  },
)
export default class QueryExtension extends React.PureComponent {
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
    if (pk !== nextProps.pk) {
      this.props.fetchExtension(nextProps.pk);
    }
  }

  render() {
    return null;
  }
}
