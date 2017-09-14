import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import {
  fetchRecipe as fetchRecipeAction,
} from 'control/state/app/recipes/actions';


@connect(
  null,
  {
    fetchRecipe: fetchRecipeAction,
  },
)
export default class QueryRecipe extends React.PureComponent {
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
