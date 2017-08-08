import { combineReducers } from 'redux';

import actions from 'control_new/state/app/actions/reducers';
import approvalRequests from 'control_new/state/app/approvalRequests/reducers';
import extensions from 'control_new/state/app/extensions/reducers';
import recipes from 'control_new/state/app/recipes/reducers';
import requests from 'control_new/state/app/requests/reducers';
import revisions from 'control_new/state/app/revisions/reducers';
import serviceInfo from 'control_new/state/app/serviceInfo/reducers';
import users from 'control_new/state/app/users/reducers';


const reducer = combineReducers({
  actions,
  approvalRequests,
  extensions,
  recipes,
  requests,
  revisions,
  serviceInfo,
  users,
});

export default reducer;
