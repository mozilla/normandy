import { Map } from 'immutable';

import Factory from 'control_new/tests/factory';
import { EXTENSION_SCHEMA } from 'control_new/tests/schemas';


export const INITIAL_STATE = {
  items: new Map(),
  listing: new Map(),
};


export class ExtensionFactory extends Factory {
  constructor(defaults = {}) {
    super(EXTENSION_SCHEMA, defaults);
  }
}
