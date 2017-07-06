import { Button } from 'antd';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import { getCurrentUser, getLogoutUrl } from 'control_new/state/serviceInfo/selectors';


@connect(
  state => ({
    user: getCurrentUser(state),
    logoutUrl: getLogoutUrl(state),
  })
)
export default class CurrentUserDetails extends React.Component {
  static propTypes = {
    user: PropTypes.object.isRequired,
    logoutUrl: PropTypes.string.isRequired,
  }

  render() {
    const { user, logoutUrl } = this.props;

    if (!user) {
      return null;
    }

    return (
      <div className="current-user">
        <span className="email">{user.get('email')}</span>

        <a href={logoutUrl}>
          <Button type="primary" icon="logout" ghost>
            Log out
          </Button>
        </a>
      </div>
    );
  }
}
