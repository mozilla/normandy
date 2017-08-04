import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import { loadExtensionListingColumns } from 'control_new/state/app/extensions/actions';


@connect(
  null,
  {
    loadExtensionListingColumns,
  },
)
export default class QueryExtensionListingColumns extends React.Component {
  static propTypes = {
    loadExtensionListingColumns: PropTypes.func.isRequired,
  };

  componentWillMount() {
    this.props.loadExtensionListingColumns();
  }

  render() {
    return null;
  }
}
