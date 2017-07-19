import { Map } from 'immutable';

import Factory from 'control_new/tests/factory';
import { REVISION_SCHEMA } from 'control_new/tests/schemas';
import { ActionFactory } from 'control_new/tests/state/actions';


export const INITIAL_STATE = {
  items: new Map(),
};


export class RevisionFactory extends Factory {
  constructor(defaults = {}) {
    super(REVISION_SCHEMA, {
      action: new ActionFactory(),
      ...defaults,
    });
  }
}
