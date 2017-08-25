import { List } from 'immutable';

import { getSessionHistory } from 'control_new/state/app/session/selectors';
import {
  INITIAL_STATE,
} from 'control_new/tests/state/session';


describe('getSessionHistory', () => {
  const historyItem = id => ({ url: id, caption: 'caption' });

  const STATE = {
    app: {
      session: {
        ...INITIAL_STATE,
      },
    },
  };

  it('should return an empty list if no history is present', () => {
    expect(getSessionHistory(STATE)).toEqual(new List([]));
  });

  it('should return the history list', () => {
    STATE.app.session.history = new List([historyItem(1), historyItem(2)]);

    expect(getSessionHistory(STATE)).toEqual(new List([historyItem(1), historyItem(2)]));
  });
});
