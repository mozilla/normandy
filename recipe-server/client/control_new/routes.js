import React, { PropTypes as pt } from 'react';
import { connect } from 'react-redux';
import { routerForBrowser } from 'redux-little-router';

import App from 'control_new/components/App';
import CreateExtensionPage from 'control_new/components/extensions/CreateExtensionPage';
import EditExtensionPage from 'control_new/components/extensions/EditExtensionPage';
import EditRecipePage from 'control_new/components/recipes/EditRecipePage';
import ExtensionListing from 'control_new/components/extensions/Listing';
import Dummy from 'control_new/components/pages/Dummy';
import Gateway from 'control_new/components/pages/Gateway';
import RecipeListing from 'control_new/components/recipes/Listing';
import MissingPage from 'control_new/components/pages/MissingPage';


const routes = {
  '/': {
    component: Gateway,
    crumb: 'Home',
    '/recipe': {
      component: RecipeListing,
      crumb: 'Recipes Listing',
      '/new': {
        component: Dummy,
        crumb: 'New Recipe',
      },
      '/:recipeId': {
        component: Dummy,
        crumb: 'View Recipe',
        '/edit': {
          component: EditRecipePage,
          crumb: 'Edit Recipe',
        },
      },
    },
    '/extension': {
      component: ExtensionListing,
      crumb: 'Extensions Listing',
      '/new': {
        component: CreateExtensionPage,
        crumb: 'New Extension',
      },
      '/:extensionId': {
        component: EditExtensionPage,
        crumb: 'Edit Extension',
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

  return <App>{content}</App>;
}

resolveRoutes.propTypes = {
  router: pt.object.isRequired,
};

export const Router = connect(state => ({
  router: state.router,
}))(resolveRoutes);
