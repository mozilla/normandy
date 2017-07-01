import React, { PropTypes as pt } from 'react';
import { connect } from 'react-redux';
import { routerForBrowser } from 'redux-little-router';

import App from 'control_new/components/App';
import Dummy from 'control_new/components/pages/Dummy';
import Gateway from 'control_new/components/pages/Gateway';
import MissingPage from 'control_new/components/pages/MissingPage';
import RecipeDetailPage from 'control_new/components/recipes/DetailPage';

const routes = {
  '/': {
    component: Gateway,
    crumb: 'Home',
    '/recipes': {
      component: Dummy,
      crumb: 'Recipes Listing',
      '/new': {
        component: Dummy,
        crumb: 'New Recipe',
      },
      '/:recipeId': {
        component: RecipeDetailPage,
        crumb: 'View Recipe',
        '/rev/:revisionId': {
          component: RecipeDetailPage,
          crumb: 'Revision',
        },
      },
    },
    '/extensions': {
      component: Dummy,
      crumb: 'Extensions Listing',
      '/new': {
        component: Dummy,
        crumb: 'New Extension',
      },
      '/:pk': {
        component: Dummy,
        crumb: 'View Extension',
      },
    },
  },
};

export const {
  reducer,
  middleware,
  enhancer,
} = routerForBrowser({
  routes,
  basename: '/control-new',
});

export function resolveRoutes({ router }) {
  let content = <MissingPage />;

  if (router.route) {
    content = <router.result.component />;
  }

  return <App children={content} />;
}

resolveRoutes.propTypes = {
  router: pt.object,
};

export const Router = connect(state => ({
  router: state.router,
}))(resolveRoutes);
