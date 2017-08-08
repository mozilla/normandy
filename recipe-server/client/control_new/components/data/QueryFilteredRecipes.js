import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import { isEqual } from 'underscore';

import { fetchFilteredRecipesPage } from 'control_new/state/app/recipes/actions';


@connect(
  null,
  {
    fetchFilteredRecipesPage,
  },
)
export default class QueryFilteredRecipes extends React.Component {
  static propTypes = {
    fetchFilteredRecipesPage: PropTypes.func,
    filters: PropTypes.object,
    pageNumber: PropTypes.number,
  }

  static defaultProps = {
    fetchFilteredRecipesPage: null,
    filters: null,
    pageNumber: null,
  }

  componentWillMount() {
    const { filters, pageNumber } = this.props;
    this.props.fetchFilteredRecipesPage(pageNumber, filters);
  }

  componentWillReceiveProps(nextProps) {
    const { filters, pageNumber } = this.props;
    if (pageNumber !== nextProps.pageNumber || !isEqual(filters, nextProps.filters)) {
      this.props.fetchFilteredRecipesPage(nextProps.pageNumber, nextProps.filters);
    }
  }

  render() {
    return null;
  }
}
