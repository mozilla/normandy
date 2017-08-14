import { List, Map } from 'immutable';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import { isEqual } from 'underscore';

import { fetchCountries } from 'control_new/state/app/countries/actions';
import { getCountries } from 'control_new/state/app/countries/selectors';

@connect(
  state => ({
    countries: getCountries(state),
  }),
  {
    fetchCountries,
  },
)
export default class QueryCountries extends React.PureComponent {
  static propTypes = {
    fetchCountries: PropTypes.func,
  };

  static defaultProps = {
    fetchCountries: null,
  };

  componentWillMount() {
    if (!this.props.countries.size) {
      this.props.fetchCountries();
    }
  }

  render() {
    return null;
  }
}
