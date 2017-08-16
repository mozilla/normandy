import { List } from 'immutable';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import { fetchLocales } from 'control_new/state/app/locales/actions';
import { getLocales } from 'control_new/state/app/locales/selectors';

@connect(
  state => ({
    locales: getLocales(state),
  }),
  {
    fetchLocales,
  },
)
export default class QueryLocales extends React.PureComponent {
  static propTypes = {
    fetchLocales: PropTypes.func,
    locales: PropTypes.instanceOf(List).isRequired,
  };

  static defaultProps = {
    fetchLocales: null,
    locales: new List(),
  };

  componentWillMount() {
    if (!this.props.locales.size) {
      this.props.fetchLocales();
    }
  }

  render() {
    return null;
  }
}
