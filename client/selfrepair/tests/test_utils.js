import { fractionToKey, stableSample, bucketSample } from '../utils';

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

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

describe('bucketSample', () => {
  it('should match at about the right rate', () => {
    const trials = 1000;
    const total = randInt(0, 10000);
    const start = randInt(0, total);
    const count = randInt(0, total - start);
    let hits = 0;
    for (let i = 0; i < trials; i++) {
      if (bucketSample(Math.random(), start, count, total)) {
        hits += 1;
      }
    }
    // 95% accurate
    const rate = count / total;
    expect(Math.abs((hits / trials) - rate) < 0.05).toEqual(true);
  });

  it('should be stable', () => {
    for (let i = 0; i < 100; i++) {
      const total = randInt(0, 10000);
      const start = randInt(0, total);
      const count = randInt(0, total - start);
      const val = Math.random();
      const hit = bucketSample(val, start, count, total);
      for (let j = 0; j < 10; j++) {
        expect(bucketSample(val, start, count, total)).toEqual(hit);
      }
    }
  });

  it('should group inputs into non-overlapping buckets', () => {
    for (let i = 0; i < 100; i++) {
      const total = randInt(100, 10000);

      // Create 10 buckets, with the end of the count as the last.
      const bucketPoints = [];
      for (let k = 0; k < 9; k++) {
        bucketPoints.push(randInt(0, total));
      }
      bucketPoints.push(total);
      bucketPoints.sort((a, b) => a - b);

      // Generate a random value, and match it against the 10 buckets.
      // It should only match one of them.
      for (let j = 0; j < 10; j++) {
        const val = Math.random();
        let foundCount = 0;
        for (let k = 0; k < bucketPoints.length; k++) {
          const start = k === 0 ? 0 : bucketPoints[k - 1];
          const count = bucketPoints[k] - start;
          if (bucketSample(val, start, count, total)) {
            // Edge case: If we encounter the same bucketPoint three times,
            // we can get more than one match if the value is at the end
            // of the bucket, since the buckets (e.g. [1,1] and [1,1]) are
            // equivalent.
            const threeInARow = (
              k > 1 && count === 0 && start === bucketPoints[k - 2]
            );
            if (threeInARow && foundCount > 0) {
              // We hit the edge case! Let's not count it.
              continue;
            }

            foundCount++;
          }
        }
        expect(foundCount).toEqual(1);
      }
    }
  });

  it('should wrap around if the bucket count exceeds the total', () => {
    for (let i = 0; i < 5; i++) {
      const total = 100;

      // Generate a value and find the bucket it is in.
      const val = Math.random();
      let valBucket = null;
      for (let k = 0; k < total; k++) {
        if (bucketSample(val, k, 1, total)) {
          valBucket = k;
          break;
        }
      }
      expect(valBucket).not.toBeNull();

      // total - 20 potentially doesn't wrap, but is likely to, and total - 5
      // is guaranteed to wrap.
      expect(bucketSample(val, valBucket + 10, total - 20, total)).toBe(false);
      expect(bucketSample(val, valBucket + 10, total - 5, total)).toBe(true);
    }
  });
});
