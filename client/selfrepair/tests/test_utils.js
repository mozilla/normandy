import { fractionToKey, stableSample } from '../utils';

function repeatString(char, times) {
  let acc = '';
  for (let i = 0; i < times; i++) {
    acc += char;
  }
  return acc;
}

describe('fractionToKey', () => {
  it('should match some known values', () => {
    // quick range check
    expect(fractionToKey(0 / 4)).toEqual(repeatString('0', 64));
    expect(fractionToKey(1 / 4)).toEqual(`4${repeatString('0', 63)}`);
    expect(fractionToKey(2 / 4)).toEqual(`8${repeatString('0', 63)}`);
    expect(fractionToKey(3 / 4)).toEqual(`c${repeatString('0', 63)}`);
    expect(fractionToKey(4 / 4)).toEqual(repeatString('f', 64));

    // Tests leading zeroes
    expect(fractionToKey(1 / 32)).toEqual(`08${repeatString('0', 62)}`);

    // The expected output here is 0.00001 * 2^256, in hex.
    expect(fractionToKey(0.00001))
      .toEqual('0000a7c5ac471b47880000000000000000000000000000000000000000000000');
  });

  it('handles error cases', () => {
    const cases = [-1, -0.5, 1.5, 2];
    for (const val of cases) {
      expect(() => fractionToKey(val))
        .toThrowError(`frac must be between 0 and 1 inclusive (got ${val})`);
    }
  });

  it('should be 64 characters long', () => {
    for (let i = 0; i < 1000; i++) {
      const r = Math.random();
      const key = fractionToKey(r);
      expect(key.length).toEqual(64);
    }
  });
});

describe('stableSample', () => {
  it('should match at about the right rate', () => {
    // This test could in theory fail randomly, but I think the probability is pretty good.
    const trials = 1000;
    const rate = Math.random();
    let hits = 0;
    for (let i = 0; i < trials; i++) {
      if (stableSample(Math.random(), rate)) {
        hits += 1;
      }
    }
    // 95% accurate
    expect(Math.abs((hits / trials) - rate) < 0.05).toEqual(true);
  });

  it('should be stable', () => {
    // Make sure that the stable sample returns the same value repeatedly.
    for (let i = 0; i < 100; i++) {
      const rate = Math.random();
      const val = Math.random();
      const hit = stableSample(val, rate);
      for (let j = 0; j < 10; j++) {
        expect(stableSample(val, rate)).toEqual(hit);
      }
    }
  });
});
