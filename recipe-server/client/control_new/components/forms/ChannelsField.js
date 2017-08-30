import { Checkbox } from 'antd';
import { List } from 'immutable';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import LoadingOverlay from 'control_new/components/common/LoadingOverlay';
import { getChannels } from 'control_new/state/app/channels/selectors';
import QueryChannels from 'control_new/components/data/QueryChannels';

const CheckboxGroup = Checkbox.Group;

@connect(state => ({
  channels: getChannels(state),
}))
export default class ChannelsField extends React.Component {
  static propTypes = {
    channels: PropTypes.instanceOf(List).isRequired,
    value: PropTypes.any,
  };

  static defaultProps = {
    value: null,
  };

  render() {
    const {
      channels,
      value,
      ...rest
    } = this.props;

    const options = channels.toJS().map(chan => ({ label: chan.value, value: chan.key }));

    return (
      <div>
        <QueryChannels />
        <LoadingOverlay requestIds={'fetch-channels'}>
          <CheckboxGroup {...rest} options={options} value={value} />
        </LoadingOverlay>
      </div>
    );
  }
}
