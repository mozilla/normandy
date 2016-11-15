import {
  REQUEST_IN_PROGRESS,
  REQUEST_COMPLETE,
} from 'actions/ControlActions.js';

const initialState = {
  isFetching: false,
  notifications: [],
};

function controlAppReducer(state = initialState, action) {
  switch (action.type) {

    case REQUEST_IN_PROGRESS:
      return {
        ...state,
        isFetching: true,
      };
    case REQUEST_COMPLETE:
      return {
        ...state,
        isFetching: false,
      };

    default:
      return state;
  }
}

export default controlAppReducer;
