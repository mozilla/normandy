import { routerReducer as routing } from 'react-router-redux';
import { combineReducers } from 'redux';
import { reducer as form } from 'redux-form';

import recipes from './recipes/reducers';


const reducer = combineReducers({
  form,
  recipes,
  routing,
});

export default reducer;
