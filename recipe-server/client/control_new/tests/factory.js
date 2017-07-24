import faker from 'faker';


let autoIncrementIndex = 0;


/* Class representing a generated field on a factory */
export class Field {
  /**
   * Creates a new generated field. These are lazy and will not be generated until .value() is
   * called.
   *
   * @param generator  A function that accepts will generate the value of the field.
   * @param options  The arguments to be passed through to the generator.
   */
  constructor(generator, ...options) {
    this.generator = generator;
    this.options = options;
  }

  /**
   * Checks if a value exists and if so returns it. If not it is generated and then returned.
   */
  value() {
    if (this._value === undefined) {
      this._value = this.generator(...this.options);
    }
    return this._value;
  }
}


/* A special type of field that always generates a unique integer. */
export class AutoIncrementField extends Field {
  constructor() {
    const generator = () => {
      autoIncrementIndex += 1;
      return autoIncrementIndex;
    };

    super(generator);
  }
}


/* A special type of field that returns an ISO 8601 formatted date string. */
export class DateField extends Field {
  constructor() {
    super(() => faker.date.past().toISOString());
  }
}


/* A special type of field that accepts a factory class instead of a generator function. */
export class SubFactory extends Field {
  constructor(factory, defaults = {}, options = {}) {
    const generator = (...args) => factory.build(...args);
    super(generator, defaults, options);
  }
}


/**
 * Class representing a data factory.
 *
 * Usage:
 * Typically you would use the build function to create a new instance of the class and return the
 * generated data.
 *
 * eg: const productData = Factory.build();
 *
 * New factories are created by extending this class (or it's subclasses) and defining a getFields
 * method which returns a keyed object where the keys represent the field names and the values are
 * an instance of the Field object or a static value to be used as is.
 *
 * Additionally a postGeneration function may be provided. This is always called after the data
 * has been generated and stored in this.data. This function can be used to manipulate generated
 * data or generate additional data based on the options provided at initialization.s
 */
export class Factory {
  /**
   * Creates a new instance of the factory.
   *
   * @param defaults  These are default values to use instead of the generated values.
   * @param options  These are additional options that are typically used by a postGeneration hook.
   */
  constructor(defaults = {}, options = {}) {
    this.options = options;
    this.data = {};

    // Check if a getFields function exists and call it or return an empty object.
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

    // Check if there is a postGeneration function and if so call it.
    if (typeof this.postGeneration === 'function') {
      this.postGeneration();
    }
  }

  static build(...args) {
    const product = new this(...args);
    return product.data;
  }
}
