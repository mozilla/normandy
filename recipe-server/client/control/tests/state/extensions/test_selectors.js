import { fromJS } from 'immutable';

import { getExtension } from 'control/state/extensions/selectors';

import {
  EXTENSION,
} from '.';

import {
  INITIAL_STATE,
} from '..';


describe('getExtension', () => {
  const STATE = {
    ...INITIAL_STATE,
    newState: {
      ...INITIAL_STATE.newState,
      extensions: {
        ...INITIAL_STATE.newState.actions,
        items: INITIAL_STATE.newState.actions.items.set(EXTENSION.id, fromJS(EXTENSION)),
      },
    },
  };

  it('should return the extension', () => {
    expect(getExtension(STATE, EXTENSION.id)).toEqual(fromJS(EXTENSION));
  });

  it('should return `null` for invalid ID', () => {
    expect(getExtension(STATE, 0)).toEqual(null);
  });

  it('should return default value for invalid ID with default provided', () => {
    expect(getExtension(STATE, 0, 'default')).toEqual('default');
  });
});
