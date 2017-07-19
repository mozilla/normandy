import { Map } from 'immutable';

import Factory from 'control_new/tests/factory';
import { ACTION_SCHEMA } from 'control_new/tests/schemas';


export const INITIAL_STATE = {
  items: new Map(),
};


export const DEFAULT_ARGUMENT_SCHEMA = {
  $schema: 'http://json-schema.org/draft-04/schema#',
  title: 'Log a message to the console',
  type: 'object',
  required: [
    'message',
  ],
  properties: {
    message: {
      description: 'Message to log to the console',
      type: 'string',
      default: '',
    },
  },
};


export class ActionFactory extends Factory {
  constructor(defaults = {}) {
    const data = {
      argument_schema: DEFAULT_ARGUMENT_SCHEMA,
      ...defaults,
    };
    super(ACTION_SCHEMA, data);
  }
}
