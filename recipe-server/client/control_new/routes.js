import React, { PropTypes as pt } from 'react';
import { connect } from 'react-redux';
import { routerForBrowser } from 'redux-little-router';

import App from 'control_new/components/App';
import Dummy from 'control_new/components/Dummy';
import Gateway from 'control_new/components/Gateway';

export const {
  reducer,
  middleware,
  enhancer,
} = routerForBrowser({
  routes: {
    '/': {
      component: Gateway,
    },
    '/recipes': {
      component: Dummy,
    },
    '/recipes/:pk': {},
    '/extensions': {},
    '/extensions/new': {
      component: Dummy,
    },
    '/extensions/:pk': {
      component: Dummy,
    },
  },
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
