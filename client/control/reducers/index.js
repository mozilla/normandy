import { combineReducers } from 'redux';

// routing/lib reducer imports
import { reducer as formReducer } from 'redux-form';
import { routerReducer } from 'react-router-redux';

// app reducer imports
import controlAppReducer from './ControlAppReducer';

export default combineReducers({
  controlApp: controlAppReducer,
  form: formReducer,
  routing: routerReducer,
});
