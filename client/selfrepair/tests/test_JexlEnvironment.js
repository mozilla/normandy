import JexlEnvironment from '../JexlEnvironment.js';

describe('JexlEnvironment', () => {
  let jexlEnv;

  beforeAll(() => {
    jexlEnv = new JexlEnvironment();
  });

  it('should pull values from the context', () => {
    const marker = Symbol();
    const context = { data: { marker } };
    jexlEnv = new JexlEnvironment(context);
    return jexlEnv.eval('data.marker')
    .then(val => expect(val).toEqual(marker));
  });

  it('should execute simple expressions', () => (
    jexlEnv.eval('2+2')
    .then(val => expect(val).toEqual(4))
  ));

  it('should execute multiline statements', () => (
    jexlEnv.eval('1 + 5 *\n8 + 1')
    .then(val => expect(val).toEqual(42))
  ));

  it('should have a date filter', () => (
    jexlEnv.eval('"2016-07-12T00:00:00"|date')
    .then(val => expect(val).toEqual(new Date(2016, 6, 12)))
  ));

  describe('stable sample filter', () => {
    it('should have a stableSample filter', () => (
      // Expect to not fail
      jexlEnv.eval('"test"|stableSample(0.5)')
    ));

    it('should return true for matching samples', () => (
      jexlEnv.eval('"test"|stableSample(1.0)')
      .then(val => expect(val).toEqual(true))
    ));

    it('should return false for matching samples', () => (
      jexlEnv.eval('"test"|stableSample(0.0)')
      .then(val => expect(val).toEqual(false))
    ));

    /**
     * This test is not, and cannot, be perfect.
     * It trades off reliably passing for accuracy of the test.
     * In it's current form, it can detect inaccuracies of 6%, but will have a
     * false failure 0.1% of the time.
     *
     * Those numbers were calculated with this Python code
     *
     *    from scipy.stats import binom
     *
     *    alpha = 0.001
     *    sample = 10000
     *    rate = 0.25
     *    low, hi = binom.interval(1 - alpha, sample, rate)
     *    expected = sample * rate
     *    print(1.0 / (low / expected), high / expected)
     *
     * The test can be made more accurate, at the cost of a higher false,
     * failure rate, and vice-versa. Accuracy can be increased without
     * sacrificing false failure rate by increasing the number of samples.
     */
    it('should sample at about the right rate', () => {
      const sample = 10000;
      const rate = 0.25;
      const accuracy = 0.06;
      const promises = [];

      for (let i = 0; i < sample; i++) {
        promises.push(jexlEnv.eval(`"${Math.random()}"|stableSample(${rate})`));
      }

      return Promise.all(promises)
      .then(results => {
        let count = results.filter(x => x).length;
        expect(count).toBeGreaterThan(sample * rate / (1 + accuracy));
        expect(count).toBeLessThan(sample * rate * (1 + accuracy));
      });
    });
  });
});
