import { List, Map } from 'immutable';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import { isEqual } from 'underscore';

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
  };

  static defaultProps = {
    fetchLocales: null,
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
