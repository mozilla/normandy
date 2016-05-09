import { createStore, applyMiddleware, combineReducers } from 'redux';
import { browserHistory } from 'react-router';
import { routerReducer, routerMiddleware } from 'react-router-redux';
import controlAppReducer from '../reducers/ControlAppReducer.js';
import thunk from 'redux-thunk';
import { reducer as formReducer } from 'redux-form';
import createLogger from 'redux-logger';

const loggerMiddleware = createLogger();
const reduxRouterMiddleware = routerMiddleware(browserHistory);

export default function controlStore(initialState) {
  return createStore(
    combineReducers({
      controlApp: controlAppReducer,
      form: formReducer,
      routing: routerReducer,
    }),
    initialState,
    applyMiddleware(
      reduxRouterMiddleware,
      thunk,
      loggerMiddleware
    )
  );
}
