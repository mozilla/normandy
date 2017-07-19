const DEFINITIONS = {
  definitions: {
    positiveInt: {
      type: 'integer',
      minimum: 0,
      exclusiveMinimum: true,
    },
  },
};

export const USER_SCHEMA = {
  type: 'object',
  properties: {
    id: {
      $ref: '#/definitions/positiveInt',
    },
    first_name: {
      type: 'string',
      faker: 'name.firstName',
    },
    last_name: {
      type: 'string',
      faker: 'name.lastName',
    },
    email: {
      type: 'string',
      faker: 'internet.email',
    },
  },
  required: [
    'id',
    'first_name',
    'last_name',
    'email',
  ],
  ...DEFINITIONS,
};


export const ACTION_SCHEMA = {
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
  ...DEFINITIONS,
};


export const APPROVAL_REQUEST_SCHEMA = {
  type: 'object',
  properties: {
    id: {
      $ref: '#/definitions/positiveInt',
    },
    approved: {
      type: 'boolean',
    },
    approver: USER_SCHEMA,
    comment: {
      type: 'string',
      faker: 'lorem.sentence',
    },
    created: {
      type: 'string',
      format: 'iso8601_date',
    },
    creator: USER_SCHEMA,
  },
  required: [
    'id',
    'approved',
    'approver',
    'comment',
    'created',
    'creator',
  ],
  ...DEFINITIONS,
};


export const EXTENSION_SCHEMA = {
  type: 'object',
  properties: {
    id: {
      $ref: '#/definitions/positiveInt',
    },
    name: {
      type: 'string',
      faker: 'lorem.slug',
    },
    xpi: {
      type: 'string',
      faker: 'internet.url',
    },
  },
  required: [
    'id',
    'name',
    'xpi',
  ],
  ...DEFINITIONS,
};
