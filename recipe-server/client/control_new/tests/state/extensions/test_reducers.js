import { fromJS } from 'immutable';

import {
  EXTENSION_RECEIVE,
} from 'control_new/state/action-types';
import extensionsReducer from 'control_new/state/app/extensions/reducers';
import {
  INITIAL_STATE,
  ExtensionFactory,
} from 'control_new/tests/state/extensions';


describe('Extensions reducer', () => {
  const extension = new ExtensionFactory();

  it('should return initial state by default', () => {
    expect(extensionsReducer(undefined, {})).toEqual(INITIAL_STATE);
  });

  it('should handle EXTENSION_RECEIVE', () => {
    expect(extensionsReducer(undefined, {
      type: EXTENSION_RECEIVE,
      extension,
    })).toEqual({
      ...INITIAL_STATE,
      items: INITIAL_STATE.items.set(extension.id, fromJS(extension)),
    });
  });
});
