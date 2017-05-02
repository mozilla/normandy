/* eslint import/prefer-default-export: "off" */

import { INITIAL_STATE as actions } from './actions';
import { INITIAL_STATE as approvalRequests } from './approvalRequests';
import { INITIAL_STATE as revisions } from './revisions';


export const INITIAL_STATE = {
  newState: {
    actions,
    approvalRequests,
    revisions,
  },
};
