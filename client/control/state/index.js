import { combineReducers } from 'redux';

import app from 'control/state/app/reducer';
import { reducer as router } from 'control/routes';


const reducer = combineReducers({
  app,
  router,
});

export default reducer;
