import { createStore, applyMiddleware, combineReducers } from 'redux';
import { browserHistory } from 'react-router';
import { routerReducer, routerMiddleware } from 'react-router-redux';
import controlAppReducer from '../reducers/ControlAppReducer.js';
import thunk from 'redux-thunk';
import { reducer as formReducer } from 'redux-form';

const reduxRouterMiddleware = routerMiddleware(browserHistory);
const defaultState = {
  controlApp: {
    recipes: null,
    isFetching: false,
    selectedRecipe: null,
    recipeListNeedsFetch: true,
    notification: null
  }
};

export default function controlStore(initialState = defaultState) {
  return createStore(
    combineReducers({
      controlApp: controlAppReducer,
      form: formReducer,
      routing: routerReducer,
    }),
    initialState,
    applyMiddleware(
      reduxRouterMiddleware,
      thunk
    )
  );
}
