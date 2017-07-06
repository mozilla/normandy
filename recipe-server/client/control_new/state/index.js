import { combineReducers } from 'redux';

import actions from 'control_new/state/actions/reducers';
import approvalRequests from 'control_new/state/approvalRequests/reducers';
import extensions from 'control_new/state/extensions/reducers';
import recipes from 'control_new/state/recipes/reducers';
import requests from 'control_new/state/requests/reducers';
import revisions from 'control_new/state/revisions/reducers';
import serviceInfo from 'control_new/state/serviceInfo/reducers';


const reducer = combineReducers({
  actions,
  approvalRequests,
  extensions,
  recipes,
  requests,
  revisions,
  serviceInfo,
});

export default reducer;
