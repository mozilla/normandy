import { routerReducer as routing } from 'react-router-redux';
import { combineReducers } from 'redux';
import { reducer as form } from 'redux-form';

import actions from './actions/reducers';
import approvalRequests from './approvalRequests/reducers';
import recipes from './recipes/reducers';
import revisions from './revisions/reducers';


const reducer = combineReducers({
  actions,
  approvalRequests,
  form,
  recipes,
  revisions,
  routing,
});

export default reducer;
