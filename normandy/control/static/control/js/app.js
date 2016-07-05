import React, { PropTypes as pt } from 'react';
import { Provider } from 'react-redux';
import controlStore from './stores/ControlStore.js';
import ControlAppRoutes from './routes.js';

import { Router, browserHistory } from 'react-router';
import { syncHistoryWithStore } from 'react-router-redux';

/**
 * Root Component for the entire app.
 */
function Root({ store, history }) {
  return (
    <Provider store={store}>
      <Router history={history}>
        {ControlAppRoutes}
      </Router>
    </Provider>
  );
}
Root.propTypes = {
  store: pt.object.isRequired,
  history: pt.object.isRequired,
};

/**
 * Initialize Redux store, history, and root component.
 */
export function createApp() {
  const store = controlStore();
  const history = syncHistoryWithStore(browserHistory, store);

  return {
    store,
    history,
    rootComponent: (<Root store={store} history={history} />),
  };
}
