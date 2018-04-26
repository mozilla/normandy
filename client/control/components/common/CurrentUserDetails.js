import { Button } from 'antd';
import { Map } from 'immutable';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import {
  getCurrentUser,
  getLogoutUrl,
} from 'control/state/app/serviceInfo/selectors';


@connect(
  state => ({
    user: getCurrentUser(state, new Map()),
    logoutUrl: getLogoutUrl(state, ''),
  }),
)
export default class CurrentUserDetails extends React.PureComponent {
  static propTypes = {
    logoutUrl: PropTypes.string.isRequired,
    user: PropTypes.instanceOf(Map).isRequired,
  };

  render() {
    const { logoutUrl, user } = this.props;

    return (
      <div className="current-user">
        <span className="email">{user.get('email')}</span>

        <a href={logoutUrl}>
          <Button type="primary" icon="logout" size="small" ghost>
            Log out
          </Button>
        </a>
      </div>
    );
  }
}
