import faker from 'faker';
import { fromJS } from 'immutable';
import jsf from 'json-schema-faker';


jsf.extend('faker', () => faker);


jsf.format('iso8601_date', () => faker.date.past(5).toISOString());
jsf.format('sha256_hash', () => jsf.utils.randexp('[0-9a-f]{64}'));


function deepCopy(from, to, schema) {
  Object.keys(schema).forEach(key => {
    let value = from[key];

    if (typeof value === 'object') {
      const nestedValue = {};
      deepCopy(value, nestedValue, schema[key]);
      value = nestedValue;
    }

    to[key] = value;
  });
}


export default class Factory {
  constructor(schema, defaults = {}) {
    const generated = jsf(schema);

    this._schema = schema;
    this._keys = Object.keys(generated);

    const data = {
      ...generated,
      ...defaults,
    };

    deepCopy(data, this, generated);

    if (this.postGeneration) {
      this.postGeneration();
    }
  }

  toObject() {
    const obj = {};
    this._keys.forEach(key => {
      obj[key] = this[key];
    });
    return obj;
  }

  toImmutable() {
    return fromJS(this.toObject());
  }
}
