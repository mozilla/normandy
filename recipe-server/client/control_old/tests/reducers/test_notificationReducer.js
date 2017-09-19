import appReducer from 'control_old/reducers';
import * as actions from 'control_old/actions/NotificationActions';
import { initialState } from 'control_old/tests/fixtures';


describe('Notification reducer', () => {
  it('should return initial state by default', () => {
    expect(appReducer(undefined, {})).toEqual(initialState);
  });

  describe('SHOW_NOTIFICATION', () => {
    it(`
      should append notifications to the notification list for the
      SHOW_NOTIFICATION action
    `, () => {
      const notification = {
        messageType: 'success',
        message: 'Success message',
        id: 5,
      };

      expect(appReducer(undefined, {
        type: actions.SHOW_NOTIFICATION,
        notification,
      })).toEqual({
        ...initialState,
        notifications: [notification],
      });
    });
  });

  describe('DISMISS_NOTIFICATION', () => {
    const notification1 = {
      messageType: 'success',
      message: 'message1',
      id: 1,
    };
    const notification2 = {
      messageType: 'success',
      message: 'message2',
      id: 2,
    };
    const startState = {
      ...initialState,
      notifications: [notification1, notification2],
    };

    it('should remove matching notifications from the notification list', () => {
      expect(
        appReducer(startState, {
          type: actions.DISMISS_NOTIFICATION,
          notificationId: notification1.id,
        }),
      ).toEqual({
        ...initialState,
        notifications: [notification2],
      });
    });

    it('should not remove any notifications when an invalid id is given', () => {
      expect(
        appReducer(startState, {
          type: actions.DISMISS_NOTIFICATION,
          id: 99999,
        }),
      ).toEqual({
        ...initialState,
        notifications: [notification1, notification2],
      });
    });
  });
});
