import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import { isEqual } from 'underscore';

import {
  fetchExtensionsPage as fetchExtensionsPageAction,
} from 'control_new/state/app/extensions/actions';


@connect(
  null,
  {
    fetchExtensionsPage: fetchExtensionsPageAction,
  },
)
export default class QueryMultipleExtensions extends React.PureComponent {
  static propTypes = {
    fetchExtensionsPage: PropTypes.func.isRequired,
    filters: PropTypes.object,
    pageNumber: PropTypes.number,
  };

  static defaultProps = {
    filters: {},
    pageNumber: null,
  };

  componentWillMount() {
    const { fetchExtensionsPage, filters, pageNumber } = this.props;
    fetchExtensionsPage(pageNumber, filters);
  }

  componentWillReceiveProps(nextProps) {
    const { fetchExtensionsPage, filters, pageNumber } = this.props;
    if (pageNumber !== nextProps.pageNumber || !isEqual(filters, nextProps.filters)) {
      fetchExtensionsPage(nextProps.pageNumber, nextProps.filters);
    }
  }

  render() {
    return null;
  }
}
