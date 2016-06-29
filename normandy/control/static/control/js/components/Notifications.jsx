import React, { PropTypes as pt } from 'react'
import { connect } from 'react-redux'
import { dismissNotification } from '../actions/ControlActions.js'
import classNames from 'classnames'
import ReactCSSTransitionGroup from 'react-addons-css-transition-group';

const notificationPropType = pt.shape({
  messageType: pt.string,
  message: pt.string,
});

class Notifications extends React.Component {
  static propTypes = {
    dispatch: pt.func,
    notifications: pt.arrayOf(notificationPropType),
  }

  render() {
    const { dispatch, notifications } = this.props;
    return (
      <ReactCSSTransitionGroup
        component="div"
        className="notifications"
        transitionName="notification"
        transitionEnterTimeout={200}
        transitionLeaveTimeout={200}
      >
        {notifications.map(n => (
          <Notification key={n.id} notification={n} dispatch={dispatch} />
        ))}
      </ReactCSSTransitionGroup>
    );
  }
}

class Notification extends React.Component {
  static propTypes = {
    dispatch: pt.func,
    notification: notificationPropType,
  }

  handleClickRemove() {
    const { dispatch, notification } = this.props;
    dispatch(dismissNotification(notification.id));
  }

  render() {
    const { notification, dispatch } = this.props;
    return (
      <div className="notification">
        <p className={`message ${notification.messageType}`}>
          { notification.message }
          <i
            className="fa fa-lg fa-times remove-message"
            onClick={::this.handleClickRemove}
          />
        </p>
      </div>
    )
  }
}

const mapStateToProps = (state) => {
  return { notifications: state.controlApp.notifications }
}

export default connect(
  mapStateToProps
)(Notifications);
