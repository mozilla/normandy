import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import { fetchRecipe } from 'control_new/state/recipes/actions';


@connect(
  null,
  {
    fetchRecipe,
  },
)
export default class QueryRecipe extends React.Component {
  static propTypes = {
    fetchRecipe: PropTypes.func.isRequired,
    pk: PropTypes.number.isRequired,
  }

  componentWillMount() {
    const { pk } = this.props;
    this.props.fetchRecipe(pk);
  }

  componentWillReceiveProps(nextProps) {
    const { pk } = this.props;
    if (nextProps.pk && pk !== nextProps.pk) {
      this.props.fetchRecipe(nextProps.pk);
    }
  }

  render() {
    return null;
  }
}
