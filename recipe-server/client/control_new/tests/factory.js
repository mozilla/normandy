import faker from 'faker';
import { fromJS } from 'immutable';
import jsf from 'json-schema-faker';


jsf.extend('faker', () => faker);


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
