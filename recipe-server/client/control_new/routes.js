import React, { PropTypes as pt } from 'react';
import { connect } from 'react-redux';
import { routerForBrowser } from 'redux-little-router';

import App from 'control_new/components/App';
import Dummy from 'control_new/components/pages/Dummy';
import Gateway from 'control_new/components/pages/Gateway';

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
      '/:pk': {
        component: Dummy,
        crumb: 'View Recipe',
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
  if (router.route) {
    return (
      <App>
        {router.result.component && <router.result.component />}
      </App>
    );
  }
  return <div>404</div>;
}

resolveRoutes.propTypes = {
  router: pt.object,
};

export const Router = connect(state => ({
  router: state.router,
}))(resolveRoutes);
