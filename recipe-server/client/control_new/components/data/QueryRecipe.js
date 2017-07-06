import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import * as recipeActions from 'control_new/state/recipes/actions';

@connect(
  null,
  dispatch => (bindActionCreators({
    fetchRecipe: recipeActions.fetchRecipe,
  }, dispatch)),
)
export default class QueryRecipe extends React.Component {
  static propTypes = {
    fetchRecipe: PropTypes.func.isRequired,
    pk: PropTypes.number.isRequired,
  }

  componentWillMount() {
    const { fetchRecipe, pk } = this.props;
    fetchRecipe(pk);
  }

  componentWillReceiveProps(nextProps) {
    const { fetchRecipe, pk } = this.props;
    if (pk !== nextProps.pk) {
      fetchRecipe(nextProps.pk);
    }
  }

  render() {
    return null;
  }
}
