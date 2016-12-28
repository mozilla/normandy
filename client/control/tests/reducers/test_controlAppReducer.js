import appReducer from 'control/reducers';
import * as actions from 'control/actions/ControlActions';
import {
  initialState,
} from 'control/tests/fixtures';

describe('controlApp reducer', () => {
  it('should return initial state by default', () => {
    expect(appReducer(undefined, {})).toEqual(initialState);
  });

  it('should handle REQUEST_IN_PROGRESS', () => {
    expect(appReducer(undefined, {
      type: actions.REQUEST_IN_PROGRESS,
    })).toEqual({
      ...initialState,
      controlApp: {
        isFetching: true,
      },
    });
  });

  it('should handle REQUEST_COMPLETE', () => {
    expect(appReducer(undefined, {
      type: actions.REQUEST_COMPLETE,
    })).toEqual({
      ...initialState,
      controlApp: {
        isFetching: false,
      },
    });
  });

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
        })
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
        })
      ).toEqual({
        ...initialState,
        notifications: [notification1, notification2],
      });
    });
  });
});
