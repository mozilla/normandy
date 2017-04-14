import { combineReducers } from 'redux';

// routing/lib reducer imports
import { reducer as formReducer } from 'redux-form';
import { routerReducer } from 'react-router-redux';

// app reducer imports
import controlAppReducer from 'control/reducers/ControlAppReducer';
import filtersReducer from 'control/reducers/FiltersReducer';
import columnReducer from 'control/reducers/ColumnReducer';
import recipesReducer from 'control/reducers/RecipesReducer';
import notificationReducer from 'control/reducers/NotificationReducer';
import userReducer from 'control/reducers/UserReducer';

import newState from '../state';

export default combineReducers({
  columns: columnReducer,
  controlApp: controlAppReducer,
  filters: filtersReducer,
  form: formReducer,
  notifications: notificationReducer,
  user: userReducer,
  recipes: recipesReducer,
  routing: routerReducer,
  newState,
});
