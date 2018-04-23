import { combineReducers } from 'redux';

import actions from 'control/state/app/actions/reducers';
import approvalRequests from 'control/state/app/approvalRequests/reducers';
import extensions from 'control/state/app/extensions/reducers';
import recipes from 'control/state/app/recipes/reducers';
import requests from 'control/state/app/requests/reducers';
import revisions from 'control/state/app/revisions/reducers';
import serviceInfo from 'control/state/app/serviceInfo/reducers';
import session from 'control/state/app/session/reducers';
import users from 'control/state/app/users/reducers';


const reducer = combineReducers({
  actions,
  approvalRequests,
  extensions,
  recipes,
  requests,
  revisions,
  serviceInfo,
  session,
  users,
});

export default reducer;
