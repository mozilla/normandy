import { combineReducers } from 'redux';

// routing/lib reducer imports
import { reducer as formReducer } from 'redux-form';
import { routerReducer } from 'react-router-redux';

// app reducer imports
import controlAppReducer from 'control/reducers/ControlAppReducer';
import columnReducer from 'control/reducers/ColumnReducer';
import recipesReducer from 'control/reducers/RecipesReducer';
import notificationReducer from 'control/reducers/NotificationReducer';
import userReducer from 'control/reducers/UserReducer';

export default combineReducers({
  controlApp: controlAppReducer,
  recipes: recipesReducer,
  columns: columnReducer,
  notifications: notificationReducer,
  user: userReducer,
  form: formReducer,
  routing: routerReducer,
});
