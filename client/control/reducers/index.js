import { combineReducers } from 'redux';

// routing/lib reducer imports
import { reducer as formReducer } from 'redux-form';
import { routerReducer } from 'react-router-redux';

// app reducer imports
import controlAppReducer from 'reducers/ControlAppReducer';
import recipesReducer from 'reducers/RecipesReducer';
import notificationReducer from 'reducers/NotificationReducer';

export default combineReducers({
  controlApp: controlAppReducer,
  recipes: recipesReducer,
  notifications: notificationReducer,
  form: formReducer,
  routing: routerReducer,
});
