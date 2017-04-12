import { routerReducer as routing } from 'react-router-redux';
import { combineReducers } from 'redux';
import { reducer as form } from 'redux-form';

import recipes from './recipes/reducers';
import revisions from './revisions/reducers';


const reducer = combineReducers({
  form,
  recipes,
  revisions,
  routing,
});

export default reducer;
