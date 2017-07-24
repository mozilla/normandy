/* eslint import/prefer-default-export: "off" */
import { INITIAL_STATE as actions } from 'control_new/tests/state/actions';
import { INITIAL_STATE as approvalRequests } from 'control_new/tests/state/approvalRequests';
import { INITIAL_STATE as extensions } from 'control_new/tests/state/extensions';
import { INITIAL_STATE as recipes } from 'control_new/tests/state/recipes';
import { INITIAL_STATE as requests } from 'control_new/tests/state/requests';
import { INITIAL_STATE as revisions } from 'control_new/tests/state/revisions';
import { INITIAL_STATE as users } from 'control_new/tests/state/users';


export const INITIAL_STATE = {
  app: {
    actions,
    approvalRequests,
    extensions,
    recipes,
    requests,
    revisions,
    users,
  },
};
