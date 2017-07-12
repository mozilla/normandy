import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { applyMiddleware, combineReducers, compose, createStore } from 'redux';
import { initializeCurrentLocation } from 'redux-little-router';
import { createLogger } from 'redux-logger';
import thunk from 'redux-thunk';

import DevTools from 'control_new/components/devtools';
import {
  enhancer as routerEnhancer,
  middleware as routerMiddleware,
  reducer as routerReducer,
  Router,
} from 'control_new/routes';
import applicationState from 'control_new/state';


const reducers = combineReducers({
  app: applicationState,
  router: routerReducer,
});


const store = createStore(reducers, reducers(undefined, { type: 'initial' }), compose(
  applyMiddleware(
    routerMiddleware,
    thunk,
    createLogger({
      collapsed: true,
      diff: false,
      duration: true,
      timestamp: true,
    }),
  ),
  routerEnhancer,
  DEVELOPMENT ? DevTools.instrument() : x => x,
));

const initialLocation = store.getState().router;
if (initialLocation) {
  store.dispatch(initializeCurrentLocation(initialLocation));
}

function Root() {
  return (
    <Provider store={store}>
      <Router />
    </Provider>
  );
}


ReactDOM.render(<Root />, document.querySelector('#main'));
