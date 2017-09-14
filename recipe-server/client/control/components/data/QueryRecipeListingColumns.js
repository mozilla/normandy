import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import { loadRecipeListingColumns } from 'control/state/app/recipes/actions';


@connect(
  null,
  {
    loadRecipeListingColumns,
  },
)
export default class QueryRecipeListingColumns extends React.PureComponent {
  static propTypes = {
    loadRecipeListingColumns: PropTypes.func.isRequired,
  };

  componentWillMount() {
    this.props.loadRecipeListingColumns();
  }

  render() {
    return null;
  }
}
