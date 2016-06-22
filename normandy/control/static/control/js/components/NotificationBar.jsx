import React from 'react'
import { connect } from 'react-redux'
import ControlActions from '../actions/ControlActions.js'
import classNames from 'classnames'

class NotificationBar extends React.Component {
  constructor() {
    super();
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.notification) {
      setTimeout(() => {
        this.removeNotification();
      }, 10000);
    }
  }

  removeNotification() {
    const { dispatch } = this.props;
    dispatch(ControlActions.setNotification());
  }

  render() {
    const { notification, dispatch } = this.props;
    return (
      <div id="notification-bar" className={classNames({ 'active': notification })}>
        { notification &&
          <p className={classNames('notification', notification.messageType)}>
            { notification.message }
            <i className="fa fa-lg fa-times remove-message" onClick={::this.removeNotification}></i>
          </p>
        }
      </div>
    )
  }
}

const mapStateToProps = (state) => {
  return { notification: state.controlApp.notification }
}

export default connect(
  mapStateToProps
)(NotificationBar);
