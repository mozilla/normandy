import { fromJS } from 'immutable';

import { getExtension } from 'control_new/state/app/extensions/selectors';

import {
  EXTENSION,
} from '.';

import {
  INITIAL_STATE,
} from '..';


describe('getExtension', () => {
  const STATE = {
    ...INITIAL_STATE,
    app: {
      ...INITIAL_STATE.app,
      extensions: {
        ...INITIAL_STATE.app.extensions,
        items: INITIAL_STATE.app.extensions.items.set(EXTENSION.id, fromJS(EXTENSION)),
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
