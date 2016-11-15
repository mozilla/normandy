import React, { PropTypes as pt } from 'react';
import { Provider } from 'react-redux';
import { Router, browserHistory } from 'react-router';
import { syncHistoryWithStore } from 'react-router-redux';

import configureStore from 'stores/configureStore.js';
import ControlAppRoutes from './routes.js';

/**
 * Root Component for the entire app.
 */
export function Root({ store, history }) {
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
  const store = configureStore();
  const history = syncHistoryWithStore(browserHistory, store);

  return {
    store,
    history,
    rootComponent: (<Root store={store} history={history} />),
  };
}
