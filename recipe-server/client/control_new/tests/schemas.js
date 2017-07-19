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


export const SIMPLE_RECIPE_SCHEMA = {
  type: 'object',
  properties: {
    id: {
      $ref: '#/definitions/positiveInt',
    },
    action: ACTION_SCHEMA,
    arguments: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          faker: 'lorem.sentence',
        },
      },
      required: ['message'],
    },
    channels: {
      type: 'array',
    },
    countries: {
      type: 'array',
    },
    enabled: {
      type: 'boolean',
    },
    extra_filter_expression: {
      type: 'string',
    },
    filter_expression: {
      type: 'string',
    },
    is_approved: {
      type: 'boolean',
    },
    locales: {
      type: 'array',
    },
    last_updated: {
      type: 'string',
      format: 'iso8601_date',
    },
    name: {
      type: 'string',
      faker: 'lorem.slug',
    },
  },
  required: [
    'id',
    'action',
    'arguments',
    'channels',
    'countries',
    'enabled',
    'extra_filter_expression',
    'filter_expression',
    'is_approved',
    'locales',
    'last_updated',
    'name',
  ],
  ...DEFINITIONS,
};


export const REVISION_SCHEMA = {
  type: 'object',
  properties: {
    id: {
      type: 'string',
      format: 'sha256_hash',
    },
    approval_request: APPROVAL_REQUEST_SCHEMA,
    comment: {
      type: 'string',
      faker: 'lorem.sentence',
    },
    date_created: {
      type: 'string',
      format: 'iso8601_date',
    },
    recipe: SIMPLE_RECIPE_SCHEMA,
    user: USER_SCHEMA,
  },
  required: [
    'id',
    'approval_request',
    'comment',
    'date_created',
    'recipe',
    'user',
  ],
  ...DEFINITIONS,
};


export const RECIPE_SCHEMA = {
  ...SIMPLE_RECIPE_SCHEMA,
  properties: {
    ...SIMPLE_RECIPE_SCHEMA.properties,
    latest_revision: REVISION_SCHEMA,
    approved_revision: REVISION_SCHEMA,
  },
  required: [
    ...SIMPLE_RECIPE_SCHEMA.required,
    'latest_revision',
    'approved_revision',
  ],
};
