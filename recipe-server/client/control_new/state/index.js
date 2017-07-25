import { combineReducers } from 'redux';

import app from 'control_new/state/app/reducer';
import { reducer as router } from 'control_new/routes';


const reducer = combineReducers({
  app,
  router,
});

export default reducer;
