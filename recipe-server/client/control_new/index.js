import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { applyMiddleware, combineReducers, compose, createStore } from 'redux';
import { initializeCurrentLocation, RouterProvider } from 'redux-little-router';
import thunk from 'redux-thunk';

import DevTools from 'control_new/components/devtools';
import {
  enhancer as routerEnhancer,
  middleware as routerMiddleware,
  reducer as routerReducer,
  Routes,
} from 'control_new/routes';
import applicationState from 'control_new/state';


const reducers = combineReducers({
  app: applicationState,
  router: routerReducer,
});


const store = createStore(reducers, reducers(undefined, { type: 'initial' }), compose(
  applyMiddleware(
    routerMiddleware,
    thunk
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
      <RouterProvider store={store}>
        <Routes />
      </RouterProvider>
    </Provider>
  );
}


ReactDOM.render(<Root />, document.querySelector('#main'));
