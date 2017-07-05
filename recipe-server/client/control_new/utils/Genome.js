import React from 'react';
import PropTypes from 'prop-types';
import bigInt from 'big-integer';

async function sha256(data) {
  const encoder = new TextEncoder('utf-8');
  const buffer = encoder.encode(JSON.stringify(data));
  const hash = await crypto.subtle.digest('SHA-256', buffer);
  return hex(hash);
}

function hex(buffer) {
  const hexCodes = [];
  const view = new DataView(buffer);
  for (let i = 0; i < view.byteLength; i += 4) {
    const value = view.getUint32(i);
    const stringValue = value.toString(16);
    // Pad with zeroes
    const padding = '00000000';
    const paddedValue = (padding + stringValue).slice(-padding.length);
    hexCodes.push(paddedValue);
  }
  return hexCodes.join('');
}

/**
 * A seedable source that provides arbitrarily sized chunks of randomness.
 */
export default class Genome {
  constructor(chromosome, entropy) {
    this.chromosome = chromosome;
    this.entropy = entropy;
    this.log = [];
  }

  /** Asyncrously returns a Genome based on the given seed.
   *
   * @param seed Any JSON serializable value. Will be used to seed the
   *             genome. If not provided, will be randomly generated.
   */
  static async generate(seed = Math.random()) {
    const hash = await sha256(JSON.stringify(seed));
    const chromosome = bigInt(hash, 16);
    return new Genome(chromosome, 256);
  }

  /**
   * Return an integer in the range [0, mod), and deduct the correct
   * amount of entropy from the pool. Vulnerable to modulus-bias when
   * `mod` is not a power of two.
   *
   * This is the fundamental way to consume a Genome. All the other
   * methods below that use entropy defer to this method.
   */
  take(mod, reason) {
    if (reason === undefined) {
      throw new Error('reason is required');
    }
    const needed = Math.log2(mod);
    if (this.entropy < needed) {
      throw new Error('Not enough entropy left in genome');
    }
    this.entropy -= needed;
    const { quotient, remainder } = this.chromosome.divmod(mod);
    this.log.push({
      reason,
      mod,
      remainder: remainder.toString(),
      before: this.chromosome.toString(),
      after: quotient.toString(),
    });
    this.chromosome = quotient;
    return remainder.toJSNumber();
  }

  /**
   * Wrap a React component, procedurally filling in props that aren't
   * passed by callers. If `seed` is passed as a prop to the resulting
   * component, it will be used to make a genome. If `genome` is
   * passed as a prop, it will be used instead of generating a new
   * genome.
   *
   * The genome will be passed as a prop to the wrapped component, for
   * passing to other genome components. For consistency, it should
   * not be used to generate random values directly.
   *
   * Example usage:
   *
   *   @Genome.wrapComponent(genome => ({ stars: genome.int(1, 10) }))
   *   class Stars extends React.Component {
   *     render() {
   *       return <span>{this.props.stars} stars</span>
   *     }
   *   }
   *
   *   <Stars />            // displays a random number of stars from 1 to 10
   *   <Stars stars={5} />  // Displays 5 stars
   *
   * @param propGenerator Will be passed a genome to make props with.
   * Will only be called once per genome.
   */
  static wrapComponent(propGenerator) {
    // extends WrappedComponent to pick up static attributes on the class
    return WrappedComponent => class Wrapper extends WrappedComponent {
      static propTypes = {
        seed: PropTypes.any,
        genome: PropTypes.shape({ then: PropTypes.func.isRequired }),
      }

      static defaultsProps = {
        seed: undefined,
        genome: undefined,
      }

      constructor(props) {
        super(props);
        const { seed, genome } = this.props;
        this.state = {
          ready: false,
          genomeProps: null,
        };
        this.wrappedComponent = WrappedComponent;
        if (genome) {
          this.genome = genome;
        } else {
          this.genome = Genome.generate(seed);
        }
        this.genome.then(genome_ => {
          this.setState({
            ready: true,
            genomeProps: propGenerator(genome_),
          });
        });
      }

      render() {
        const { ready, genomeProps } = this.state;
        if (!ready) {
          return null;
        }

        let builtProps = { ...this.props };
        // don't pass `seed` thru to wrapped component
        delete builtProps.seed;
        // passed props override genome props, but genome can't be overridden
        builtProps = { ...genomeProps, ...builtProps, genome: this.genome };
        return <WrappedComponent {...builtProps} />;
      }
    };
  }

  /** Choose a random value from an array. */
  choice(options, extra) {
    const idx = this.take(options.length, extra);
    return options[idx];
  }

  /** Choose a random object from an array by weight.
   * `options` should be objects with at least a `weight` key.
   */
  weightedChoice(options, reason) {
    const sumWeights = options.map(o => o.weight).reduce((a, b) => a + b);
    let choice = this.take(sumWeights, reason);
    for (const option of options) {
      choice -= option.weight;
      if (choice <= 0) {
        return option;
      }
    }
    throw new Error('assertion error: no choices chosen');
  }

  /** A random integer between `min` and `max` */
  int(min, max, reason) {
    return this.take(max - min, reason) + min;
  }

  /**
   * Generates a random integer in [0, precision), and then maps that as a
   * float to the range [min, max).
   */
  float(min, max, precision, reason) {
    const r = this.take(precision, reason) / precision;
    return r * (max - min) + min;
  }

  /** Generates a random capital letter. */
  letter(reason) {
    return this.int(10, 36, reason).toString(36).toUpperCase();
  }
}
