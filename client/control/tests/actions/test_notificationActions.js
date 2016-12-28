import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import * as actionTypes from 'control/actions/NotificationActions';

import { initialState } from 'control/tests/fixtures';

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
