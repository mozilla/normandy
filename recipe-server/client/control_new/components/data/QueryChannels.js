import { List } from 'immutable';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import { fetchChannels } from 'control_new/state/app/channels/actions';
import { getChannels } from 'control_new/state/app/channels/selectors';

@connect(
  state => ({
    channels: getChannels(state),
  }),
  {
    fetchChannels,
  },
)
export default class QueryChannels extends React.PureComponent {
  static propTypes = {
    fetchChannels: PropTypes.func,
    channels: PropTypes.instanceOf(List).isRequired,
  };

  static defaultProps = {
    fetchChannels: null,
    channels: new List(),
  };

  componentWillMount() {
    if (!this.props.channels.size) {
      this.props.fetchChannels();
    }
  }

  render() {
    return null;
  }
}
