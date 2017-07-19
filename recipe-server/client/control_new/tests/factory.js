import faker from 'faker';
import { fromJS } from 'immutable';
import jsf from 'json-schema-faker';


jsf.extend('faker', () => faker);


jsf.format('iso8601_date', () => faker.date.past(5).toISOString());


export default class Factory {
  constructor(schema, defaults = {}) {
    const generated = jsf(schema);

    const data = {
      ...generated,
      ...defaults,
    };

    this._keys = Object.keys(generated);

    this._keys.forEach(key => {
      this[key] = data[key];
    });

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
