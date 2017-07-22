import { fromJS } from 'immutable';

import { getExtension } from 'control_new/state/app/extensions/selectors';
import {
  INITIAL_STATE,
} from 'control_new/tests/state';
import {
  ExtensionFactory,
} from 'control_new/tests/state/extensions';


describe('getExtension', () => {
  const extension = ExtensionFactory.build();

  const STATE = {
    ...INITIAL_STATE,
    app: {
      ...INITIAL_STATE.app,
      extensions: {
        ...INITIAL_STATE.app.extensions,
        items: INITIAL_STATE.app.extensions.items.set(extension.id, fromJS(extension)),
      },
    },
  };

  it('should return the extension', () => {
    expect(getExtension(STATE, extension.id)).toEqual(fromJS(extension));
  });

  it('should return `null` for invalid ID', () => {
    expect(getExtension(STATE, 0)).toEqual(null);
  });

  it('should return default value for invalid ID with default provided', () => {
    expect(getExtension(STATE, 0, 'default')).toEqual('default');
  });
});
