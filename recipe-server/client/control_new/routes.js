import React from 'react';
import { Fragment, routerForBrowser } from 'redux-little-router';

import App from 'control_new/components/App';
import Dummy from 'control_new/components/Dummy';


export const {
  reducer,
  middleware,
  enhancer,
} = routerForBrowser({
  routes: {
    '/': {
      title: 'Control',
    },
  },
  basename: '/control-new',
});


export function Routes() {
  return (
    <App>
      <Fragment forRoute="/">
        <Dummy />
      </Fragment>
    </App>
  );
}
