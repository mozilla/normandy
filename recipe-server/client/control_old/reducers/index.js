import { combineReducers } from 'redux';

// routing/lib reducer imports
import { reducer as formReducer } from 'redux-form';
import { routerReducer } from 'react-router-redux';

// app reducer imports
import controlAppReducer from 'control_old/reducers/ControlAppReducer';
import filtersReducer from 'control_old/reducers/FiltersReducer';
import columnReducer from 'control_old/reducers/ColumnReducer';
import recipesReducer from 'control_old/reducers/RecipesReducer';
import notificationReducer from 'control_old/reducers/NotificationReducer';
import userReducer from 'control_old/reducers/UserReducer';

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
