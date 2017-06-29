import pt from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import { fetchRecipe } from 'control_new/state/recipes/actions';
import { getPk } from 'control_new/state/router/selectors';

@connect(
  state => ({
    pk: getPk(state),
  }),
  dispatch => bindActionCreators({ fetchRecipe }, dispatch)
)
export default class QueryRecipe extends React.Component {
  static propTypes = {
    fetchRecipe: pt.func.isRequired,
    pk: pt.number.isRequired,
  }

  componentWillMount() {
    const { pk } = this.props;
    this.props.fetchRecipe(pk);
  }

  componentWillReceiveProps(nextProps) {
    const { pk } = this.props;
    if (pk !== nextProps.pk) {
      this.props.fetchRecipe(nextProps.pk);
    }
  }

  render() {
    return null;
  }
}
