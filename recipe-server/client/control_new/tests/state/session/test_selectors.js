import { List, fromJS, is } from 'immutable';

import { getSessionHistory } from 'control_new/state/app/session/selectors';
import {
  INITIAL_STATE,
  SessionFactory,
} from 'control_new/tests/state/session';

const createSessions = (count, category) => {
  const items = [];
  for (let idx = 0; idx < count; idx++) {
    const newItem = SessionFactory.build({ category });
    items.push(fromJS(newItem));
  }

  return items;
};

describe('getSessionHistory', () => {
  const state = {
    app: {
      session: {
        ...INITIAL_STATE,
      },
    },
  };

  it('should return an empty list if no history is present', () => {
    expect(getSessionHistory(state), 'recipe').toEqual(new List([]));
  });

  it('should return the history list for the appropriate category', () => {
    const recipes = createSessions(2, 'recipe');
    const extensions = createSessions(2, 'extension');

    // Test getting 'recipe' session history.
    const recipeHistory = new List([recipes[0], recipes[1]]);
    state.app.session.history = recipeHistory;
    const recipeQuery = getSessionHistory(state, 'recipe');
    expect(is(recipeQuery, recipeHistory)).toBe(true);

    // Test getting 'extension' session history.
    const extHistory = new List([extensions[0], extensions[1]]);
    state.app.session.history = extHistory;
    const extensionQuery = getSessionHistory(state, 'extension');
    expect(is(extensionQuery, extHistory)).toBe(true);
  });

  it('should return an empty history list if none of the given category is available', () => {
    const fakeHistory = new List(createSessions(2, 'recipe'));
    state.app.session.history = fakeHistory;
    expect(getSessionHistory(state, 'extension')).toEqual(new List());
    expect(is(getSessionHistory(state, 'recipe'), fakeHistory)).toBe(true);
  });
});
