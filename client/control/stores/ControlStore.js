import { compose, createStore, applyMiddleware } from 'redux';
import { browserHistory } from 'react-router';
import { routerMiddleware } from 'react-router-redux';
import thunk from 'redux-thunk';
import DevTools from 'components/DevTools.js';

import reducers from 'reducers';

const reduxRouterMiddleware = routerMiddleware(browserHistory);

// middleware
const enhancer = compose(
  applyMiddleware(
    reduxRouterMiddleware,
    thunk
  ),
  // Only include DevTools in development mode
  DEVELOPMENT ? DevTools.instrument() : x => x,
);

export default function controlStore(initialState) {
  return createStore(reducers, initialState, enhancer);
}
