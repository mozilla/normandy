import { compose, createStore, applyMiddleware, combineReducers } from 'redux';
import { browserHistory } from 'react-router';
import { routerReducer, routerMiddleware } from 'react-router-redux';
import thunk from 'redux-thunk';
import { reducer as formReducer } from 'redux-form';
import DevTools from '../components/DevTools.js';

import controlAppReducer from '../reducers/ControlAppReducer.js';

const reduxRouterMiddleware = routerMiddleware(browserHistory);

const enhancer = compose(
  applyMiddleware(
    reduxRouterMiddleware,
    thunk
  ),

  // Only include DevTools in development mode
  DEVELOPMENT ? DevTools.instrument() : x => x,
);

export default function controlStore() {
  return createStore(
    combineReducers({
      controlApp: controlAppReducer,
      form: formReducer,
      routing: routerReducer,
    }),
    {
      controlApp: {
        recipes: null,
        isFetching: false,
        selectedRecipe: null,
        recipeListNeedsFetch: true,
        notifications: [],
      },
    },
    enhancer,
  );
}
