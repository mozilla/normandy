import { List, Map } from 'immutable';
import { Transfer } from 'antd';
import autobind from 'autobind-decorator';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import { getLocales } from 'control_new/state/app/locales/selectors';
import TransferField from 'control_new/components/forms/TransferField';
import QueryLocales from 'control_new/components/data/QueryLocales';


@connect(state => ({
  locales: getLocales(state),
}))
export default class LocalesField extends React.Component {
  render() {
    return (
      <div>
        <QueryLocales />
        <TransferField
          titles={['Available', 'Selected']}
          data={this.props.locales}
          {...this.props}
        />
      </div>
    );
  }
}
