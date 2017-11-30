/* eslint import/prefer-default-export: "off" */
import { INITIAL_STATE as actions } from 'control/tests/state/actions';
import { INITIAL_STATE as approvalRequests } from 'control/tests/state/approvalRequests';
import { INITIAL_STATE as extensions } from 'control/tests/state/extensions';
import { INITIAL_STATE as recipes } from 'control/tests/state/recipes';
import { INITIAL_STATE as requests } from 'control/tests/state/requests';
import { INITIAL_STATE as revisions } from 'control/tests/state/revisions';
import { INITIAL_STATE as router } from 'control/tests/state/router';
import { INITIAL_STATE as serviceInfo } from 'control/tests/state/serviceInfo';
import { INITIAL_STATE as users } from 'control/tests/state/users';


export const INITIAL_STATE = {
  app: {
    actions,
    approvalRequests,
    extensions,
    recipes,
    requests,
    revisions,
    serviceInfo,
    users,
  },
  router,
};
