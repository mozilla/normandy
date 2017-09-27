import { Map } from 'immutable';

import {
  SESSION_INFO_HISTORY_VIEW,
} from 'control/state/action-types';

import { addSessionView } from 'control/state/app/session/actions';

describe('Session actions', () => {
  describe('addSessionView', () => {
    // Params = the 'default' test params passed into addSessionView
    const defaultParams = ['category', 'caption', 'identicon'];
    // Values = the 'default' dispatched values given our default params.
    const defaultValues = { caption: 'caption', category: 'category', identicon: 'identicon' };


    it('should dispatch a SESSION_INFO_HISTORY_VIEW event', async () => {
      const meta = {
        dispatch: () => {},
      };
      spyOn(meta, 'dispatch').and.callThrough();

      const getState = () => ({ router: { pathname: '/fake/url' } });

      await addSessionView(...defaultParams)(meta.dispatch, getState);

      expect(meta.dispatch).toHaveBeenCalledWith({
        type: SESSION_INFO_HISTORY_VIEW,
        item: new Map({ url: '/fake/url', ...defaultValues }),
      });
    });

    it('should prevent /edit, /clone, or /approval_history links from registering', async () => {
      const meta = { dispatch: () => {} };
      spyOn(meta, 'dispatch').and.callThrough();

      let getState = () => ({ router: { pathname: '/fake/url/edit/' } });
      await addSessionView(...defaultParams)(meta.dispatch, getState);
      expect(meta.dispatch).toHaveBeenCalledWith({
        type: SESSION_INFO_HISTORY_VIEW,
        item: new Map({ url: '/fake/url/', ...defaultValues }),
      });

      getState = () => ({ router: { pathname: '/fake/url/clone/' } });
      await addSessionView(...defaultParams)(meta.dispatch, getState);
      expect(meta.dispatch).toHaveBeenCalledWith({
        type: SESSION_INFO_HISTORY_VIEW,
        item: new Map({ url: '/fake/url/', ...defaultValues }),
      });

      getState = () => ({ router: { pathname: '/fake/url/approval_history/' } });
      await addSessionView(...defaultParams)(meta.dispatch, getState);
      expect(meta.dispatch).toHaveBeenCalledWith({
        type: SESSION_INFO_HISTORY_VIEW,
        item: new Map({ url: '/fake/url/', ...defaultValues }),
      });
    });
  });
});

