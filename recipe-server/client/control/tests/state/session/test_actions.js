import { Map } from 'immutable';

import {
  SESSION_INFO_HISTORY_VIEW,
} from 'control/state/action-types';

import { addSessionView } from 'control/state/app/session/actions';

describe('Session actions', () => {
  describe('addSessionView', () => {
    // Params = the 'default' test params passed into addSessionView
    const defaultParams = ['recipe', 'caption', 'identicon'];
    // Values = the 'default' dispatched values given our default params.
    const defaultValues = { caption: 'caption', category: 'recipe', identicon: 'identicon' };


    it('should dispatch a SESSION_INFO_HISTORY_VIEW event', async () => {
      const dispatch = jasmine.createSpy('dispatch');

      const getState = () => ({ router: { pathname: '/fake/url' } });

      await addSessionView(...defaultParams)(dispatch, getState);

      expect(dispatch).toHaveBeenCalledWith({
        type: SESSION_INFO_HISTORY_VIEW,
        item: new Map({ url: '/fake/url', ...defaultValues }),
      });
    });

    it('should redirect session routes if given a `sessionSlug` property', async () => {
      const dispatch = jasmine.createSpy('dispatch');

      let getState = () => ({
        router: { pathname: '/recipe/:recipeId/edit/', result: { sessionSlug: 'recipe-view' } },
      });
      await addSessionView(...defaultParams)(dispatch, getState);
      expect(dispatch).toHaveBeenCalledWith({
        type: SESSION_INFO_HISTORY_VIEW,
        item: new Map({ url: '/recipe/:recipeId/', ...defaultValues }),
      });

      getState = () => ({
        router: { pathname: '/recipe/:recipeId/clone/', result: { sessionSlug: 'recipe-new' } },
      });
      await addSessionView(...defaultParams)(dispatch, getState);
      expect(dispatch).toHaveBeenCalledWith({
        type: SESSION_INFO_HISTORY_VIEW,
        item: new Map({ url: '/recipe/new/', ...defaultValues }),
      });

      getState = () => ({
        router: { pathname: '/recipe/:recipeId/approval_history/', result: { sessionSlug: 'recipe-edit' } },
      });
      await addSessionView(...defaultParams)(dispatch, getState);
      expect(dispatch).toHaveBeenCalledWith({
        type: SESSION_INFO_HISTORY_VIEW,
        item: new Map({ url: '/recipe/:recipeId/edit/', ...defaultValues }),
      });
    });
  });
});

