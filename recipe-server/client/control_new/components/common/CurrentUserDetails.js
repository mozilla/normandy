import { Button } from 'antd';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import {
  getCurrentUser,
  getLogoutUrl,
} from 'control_new/state/serviceInfo/selectors';


@connect(
  state => ({
    user: getCurrentUser(state),
    logoutUrl: getLogoutUrl(state),
  }),
)
export default class CurrentUserDetails extends React.Component {
  static propTypes = {
    logoutUrl: PropTypes.string.isRequired,
    user: PropTypes.object.isRequired,
  }

  render() {
    const { logoutUrl, user } = this.props;

    if (!user) {
      return null;
    }

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
