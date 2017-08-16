import { List } from 'immutable';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import LoadingOverlay from 'control_new/components/common/LoadingOverlay';
import { getLocales } from 'control_new/state/app/locales/selectors';
import TransferField from 'control_new/components/forms/TransferField';
import QueryLocales from 'control_new/components/data/QueryLocales';


@connect(state => ({
  locales: getLocales(state),
}))
export default class LocalesField extends React.Component {
  static propTypes = {
    locales: PropTypes.instanceOf(List).isRequired,
  };

  render() {
    return (
      <div>
        <QueryLocales />
        <LoadingOverlay requestIds={'fetch-locales'}>
          <TransferField
            titles={['Available', 'Selected']}
            data={this.props.locales}
            {...this.props}
          />
        </LoadingOverlay>
      </div>
    );
  }
}
