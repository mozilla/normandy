import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import { initialState } from 'control_old/tests/fixtures';
import * as actionTypes from 'control_old/actions/NotificationActions';

const middlewares = [thunk];
const mockStore = configureMockStore(middlewares);
const store = mockStore({ ...initialState });

describe('Notification Actions', () => {
  afterEach(() => {
    store.clearActions();
  });

  describe('showNotification', () => {
    it('automatically dismisses notifications after 10 seconds', async () => {
      jasmine.clock().install();

      const notification = { messageType: 'success', message: 'message' };
      await store.dispatch(actionTypes.showNotification(notification));

      const dismissAction = actionTypes.dismissNotification(notification.id);
      expect(store.getActions()).not.toContain(dismissAction);
      jasmine.clock().tick(10001);
      expect(store.getActions()).toContain(dismissAction);

      jasmine.clock().uninstall();
    });
  });
});
