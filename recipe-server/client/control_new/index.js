import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { applyMiddleware, combineReducers, compose, createStore } from 'redux';
import { initializeCurrentLocation } from 'redux-little-router';
import { createLogger } from 'redux-logger';
import thunk from 'redux-thunk';

import Router, {
  enhancer as routerEnhancer,
  middleware as routerMiddleware,
  reducer as routerReducer,
} from 'control_new/routes';
import applicationState from 'control_new/state';


const reducers = combineReducers({
  app: applicationState,
  router: routerReducer,
});

const middleware = [
  routerMiddleware,
  thunk,
];

if (DEVELOPMENT) {
  middleware.push(
    createLogger({
      collapsed: true,
      diff: false,
      duration: true,
      timestamp: true,
    }),
  );
}

const store = createStore(reducers, reducers(undefined, { type: 'initial' }), compose(
  applyMiddleware(...middleware),
  routerEnhancer,
));

const initialLocation = store.getState().router;
if (initialLocation) {
  store.dispatch(initializeCurrentLocation(initialLocation));
}

class Root extends React.Component {
  render() {
    return (
      <Provider store={store}>
        <Router />
      </Provider>
    );
  }
}


ReactDOM.render(<Root />, document.querySelector('#main'));
