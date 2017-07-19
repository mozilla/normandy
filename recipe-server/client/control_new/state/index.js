import { combineReducers } from 'redux';

import app from 'control_new/state/app/reducer';
import router from 'control_new/state/router/reducer';


const reducer = combineReducers({
  app,
  router,
});

export default reducer;
