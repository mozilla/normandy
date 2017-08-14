import { List, Map } from 'immutable';
import { Transfer } from 'antd';
import autobind from 'autobind-decorator';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import { getCountries } from 'control_new/state/app/countries/selectors';
import TransferField from 'control_new/components/forms/TransferField';
import QueryCountries from 'control_new/components/data/QueryCountries';


@connect(state => ({
  countries: getCountries(state),
}))
export default class CountriesField extends React.Component {
  render() {
    return (
      <div>
        <QueryCountries />
        <TransferField
          titles={['Available', 'Selected']}
          data={this.props.countries}
          {...this.props}
        />
      </div>
    );
  }
}
