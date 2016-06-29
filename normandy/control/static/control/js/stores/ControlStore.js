import { createStore, applyMiddleware, combineReducers } from 'redux';
import { browserHistory } from 'react-router';
import { routerReducer, routerMiddleware } from 'react-router-redux';
import controlAppReducer from '../reducers/ControlAppReducer.js';
import thunk from 'redux-thunk';
import { reducer as formReducer } from 'redux-form';

const reduxRouterMiddleware = routerMiddleware(browserHistory);

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
        notifications: []
      }
    },
    applyMiddleware(
      reduxRouterMiddleware,
      thunk
    )
  );
}
