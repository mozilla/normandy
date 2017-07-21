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
    super(factory);
    this.defaults = defaults;
    this.options = options;
  }

  generate() {
    const Generator = this.generator;
    return new Generator(this.defaults, this.options);
  }
}


export class Factory {
  static fields = {}

  constructor(defaults = {}, options = {}) {
    Object.defineProperty(this, '_options', {
      enumerable: false,
      configurable: false,
      writable: false,
      value: options,
    });

    Object.defineProperty(this, '_fields', {
      enumerable: false,
      configurable: false,
      writeable: false,
      value: this.constructor.fields,
    });

    Object.keys(this._fields).forEach(key => {
      if (defaults[key]) {
        this[key] = defaults[key];
      } else if (this._fields[key] instanceof Field) {
        this[key] = this._fields[key].value();
      } else {
        this[key] = this._fields[key];
      }
    });

    if (typeof this.postGeneration === 'function') {
      this.postGeneration();
    }
  }
}
