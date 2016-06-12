import React from 'react'
import { connect } from 'react-redux'
import { setNotification } from '../actions/ControlActions.js'
import classNames from 'classnames'

class NotificationBar extends React.Component {
  constructor() {
    super();
    this.state = {
      isVisible: false
    }
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.notification) {
      this.setState({
        isVisible: true
      });
      this.setVisibilityTimer();
    }
  }

  setVisibilityTimer() {
    this.visibilityTimer !== null ? clearTimeout(this.visibilityTimer) : null;

    this.visibilityTimer = setTimeout(() => {
      this.setState({
        isVisible: false
      })
    }, 10000);
  }

  hideNotificationBar() {
    this.setState({
      isVisible: false
    });
    clearTimeout(this.visibilityTimer);
  }

  render() {
    const { notification, dispatch } = this.props;
    return (
      <div id="notification-bar" className={classNames({ 'active': this.state.isVisible })}>
        { notification &&
          <p className={classNames('notification', notification.messageType)}>
            { notification.message }
            <i className="fa fa-lg fa-times remove-message" onClick={::this.hideNotificationBar}></i>
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
