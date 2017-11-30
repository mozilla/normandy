import { applyMiddleware, compose, createStore } from 'redux';
import { push, initializeCurrentLocation } from 'redux-little-router';

import reducers from 'control/state';
import { enhancer as routerEnhancer, middleware as routerMiddleware } from 'control/routes';
import {
  getUrlParam,
  getUrlParamAsInt,
  getQueryParam,
  getQueryParamAsInt,
  getCurrentURL,
  getRouterPath,
  getBreadcrumbs,
} from 'control/state/router/selectors';


describe('route selectors', () => {
  let store;
  const middleware = [
    routerMiddleware,
  ];

  beforeEach(() => {
    store = createStore(reducers, undefined, compose(
      applyMiddleware(...middleware),
      routerEnhancer,
    ));

    const initialLocation = store.getState().router;
    if (initialLocation) {
      store.dispatch(initializeCurrentLocation(initialLocation));
    }
  });

  describe('getUrlParam', () => {
    it('works', () => {
      // Using route /recipe/:recipeId/
      store.dispatch(push('/recipe/42/'));
      const val = getUrlParam(store.getState(), 'recipeId');
      expect(val).toEqual('42');
    });

    it('returns the default', () => {
      // Using route /recipe/:recipeId/
      store.dispatch(push('/recipe/42/'));
      const val = getUrlParam(store.getState(), 'nonexistent', 'default');
      expect(val).toEqual('default');
    });
  });

  describe('getUrlParamAsInt', () => {
    it('works', () => {
      // Using route /recipe/:recipeId/
      store.dispatch(push('/recipe/42/'));
      const val = getUrlParamAsInt(store.getState(), 'recipeId');
      expect(val).toEqual(42);
    });

    it('returns the default', () => {
      // Using route /recipe/:recipeId/
      store.dispatch(push('/recipe/42/'));
      const val = getUrlParamAsInt(store.getState(), 'nonexistent', 64);
      expect(val).toEqual(64);
    });
  });

  describe('getQueryParam', () => {
    it('works', () => {
      store.dispatch(push('/?foo=bar'));
      const val = getQueryParam(store.getState(), 'foo');
      expect(val).toEqual('bar');
    });

    it('returns the default', () => {
      store.dispatch(push('/?foo=bar'));
      const val = getQueryParam(store.getState(), 'nonexistent', 'default');
      expect(val).toEqual('default');
    });
  });

  describe('getQueryParamAsInt', () => {
    it('works', () => {
      store.dispatch(push('/?x=42'));
      const val = getQueryParamAsInt(store.getState(), 'x');
      expect(val).toEqual(42);
    });

    it('returns the default', () => {
      store.dispatch(push('/?x=42'));
      const val = getQueryParamAsInt(store.getState(), 'nonexistent', 64);
      expect(val).toEqual(64);
    });
  });

  describe('getCurrentURL', () => {
    it('works', () => {
      // using route /recipe/:recipeId/
      store.dispatch(push('/recipe/42/?old=foo'));
      const val = getCurrentURL(store.getState(), { new: 'bar' });
      expect(val).toEqual({
        pathname: '/recipe/42/',
        query: {
          old: 'foo',
          new: 'bar',
        },
      });
    });
  });

  describe('getRouterPath', () => {
    it('works', () => {
      // using route /recipe/:recipeId/
      store.dispatch(push('/recipe/42/?old=foo'));
      const val = getRouterPath(store.getState());
      expect(val).toEqual('/recipe/42/');
    });
  });

  describe('getBreadcrumbs', () => {
    it('works for the root', () => {
      store.dispatch(push('/'));
      const val = getBreadcrumbs(store.getState());
      expect(val).toEqual([
        { name: 'Home', link: '/' },
      ]);
    });

    it('works for interior pages', () => {
      // using route /recipe/:recipeId/
      store.dispatch(push('/recipe/42/'));
      const val = getBreadcrumbs(store.getState());
      expect(val).toEqual([
        { name: 'Home', link: '/' },
        { name: 'Recipes Listing', link: '/recipe/' },
        { name: 'View Recipe', link: '/recipe/42/' },
      ]);
    });

    it('works for leaf pages', () => {
      // using route /recipe/:recipeId/edit/
      store.dispatch(push('/recipe/42/edit/'));
      const val = getBreadcrumbs(store.getState());
      expect(val).toEqual([
        { name: 'Home', link: '/' },
        { name: 'Recipes Listing', link: '/recipe/' },
        { name: 'View Recipe', link: '/recipe/42/' },
        { name: 'Edit Recipe', link: '/recipe/42/edit/' },
      ]);
    });
  });
});
