import { List } from 'immutable';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import LoadingOverlay from 'control_new/components/common/LoadingOverlay';
import { getCountries } from 'control_new/state/app/countries/selectors';
import TransferField from 'control_new/components/forms/TransferField';
import QueryCountries from 'control_new/components/data/QueryCountries';


@connect(state => ({
  countries: getCountries(state),
}))
export default class CountriesField extends React.Component {
  static propTypes = {
    countries: PropTypes.instanceOf(List).isRequired,
  };

  render() {
    return (
      <div>
        <QueryCountries />
        <LoadingOverlay requestIds={'fetch-countries'}>
          <TransferField
            titles={['Available', 'Selected']}
            data={this.props.countries}
            {...this.props}
          />
        </LoadingOverlay>
      </div>
    );
  }
}
