import faker from 'faker';


let autoIncrementIndex = 0;


export class Field {
  constructor(generator, ...options) {
    this.generator = generator;
    this.options = options;
  }

  generate() {
    return this.generator(...this.options);
  }

  value() {
    if (this._value === undefined) {
      this._value = this.generate();
    }
    return this._value;
  }
}


export class AutoIncrementField extends Field {
  constructor() {
    const generator = () => {
      autoIncrementIndex += 1;
      return autoIncrementIndex;
    };

    super(generator);
  }
}


export class DateField extends Field {
  constructor() {
    super(() => faker.date.past().toISOString());
  }
}


export class SubFactory extends Field {
  constructor(factory, defaults = {}, options = {}) {
    const generator = (...args) => factory.build(...args);
    super(generator, defaults, options);
  }
}


export class Factory {
  constructor(defaults = {}, options = {}) {
    this.options = options;
    this.data = {};

    const fields = (typeof this.getFields === 'function') ? this.getFields() : {};

    Object.keys(fields).forEach(key => {
      if (defaults[key]) {
        this.data[key] = defaults[key];
      } else if (fields[key] instanceof Field) {
        this.data[key] = fields[key].value();
      } else {
        this.data[key] = fields[key];
      }
    });

    if (typeof this.postGeneration === 'function') {
      this.postGeneration();
    }
  }

  static build(...args) {
    const product = new this(...args);
    return product.data;
  }
}
