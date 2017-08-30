import { List } from 'immutable';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

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
    countries: PropTypes.instanceOf(List).isRequired,
    fetchCountries: PropTypes.func,
  };

  static defaultProps = {
    countries: new List(),
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
