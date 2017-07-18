import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import {
  fetchExtensionsPage as fetchExtensionsPageAction,
} from 'control_new/state/extensions/actions';


@connect(
  null,
  {
    fetchExtensionsPage: fetchExtensionsPageAction,
  },
)
export default class QueryMultipleExtensions extends React.Component {
  static propTypes = {
    fetchExtensionsPage: PropTypes.func.isRequired,
    pageNumber: PropTypes.number,
  };

  static defaultProps = {
    pageNumber: null,
  };

  componentWillMount() {
    const { fetchExtensionsPage, pageNumber } = this.props;
    fetchExtensionsPage(pageNumber);
  }

  componentWillReceiveProps(nextProps) {
    const { fetchExtensionsPage, pageNumber } = this.props;
    if (pageNumber !== nextProps.pageNumber) {
      fetchExtensionsPage(nextProps.pageNumber);
    }
  }

  render() {
    return null;
  }
}
