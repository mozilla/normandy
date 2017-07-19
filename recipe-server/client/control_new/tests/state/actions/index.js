import { Map } from 'immutable';

import Factory from 'control_new/tests/factory';


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


const ACTION_SCHEMA = {
  type: 'object',
  properties: {
    id: {
      $ref: '#/definitions/positiveInt',
    },
    name: {
      type: 'string',
      faker: 'lorem.slug',
    },
    argument_schema: {
      type: 'object',
    },
    implementation_url: {
      type: 'string',
      faker: 'internet.url',
    },
  },
  required: [
    'id',
    'name',
    'argument_schema',
    'implementation_url',
  ],
  definitions: {
    positiveInt: {
      type: 'integer',
      minimum: 0,
      exclusiveMinimum: true,
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
