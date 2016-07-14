import JexlEnvironment from '../static/js/JexlEnvironment.js';

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
  });
});
