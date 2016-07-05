import Sha256 from 'sha.js/sha256';

export function stableSample(input, rate) {
  const hasher = new Sha256();
  hasher.update(JSON.stringify(input));

  const samplePoint = fractionToKey(rate);
  const inputHash = hasher.digest('hex');

  if (samplePoint.length !== 64 || inputHash.length !== 64) {
    throw new Error('Unexpected hash length');
  }

  return inputHash < samplePoint;
}

/**
 * Map from the range [0, 1] to [0, max(sha256)].
 * @param  {number} frac A float from 0.0 to 1.0.
 * @return {string} A string in the sha256 hash space. Will be zero padded to 64
 *   characters.
 */
export function fractionToKey(frac) {
    // SHA 256 hashes are 64-digit hexadecimal numbers. The largest possible SHA
    // 256 hash is 2^256 - 1.

  if (frac < 0 || frac > 1) {
    throw new Error(`frac must be between 0 and 1 inclusive (got ${frac})`);
  }

  const mult = 2 ** 256 - 1;
  const inDecimal = Math.floor(frac * mult);
  let hexDigits = inDecimal.toString(16);
  if (hexDigits.length < 64) {
        // Left pad with zeroes
        // If N zeroes are needed, generate an array of nulls N+1 elements long,
        // and inserts zeroes between each null.
    hexDigits = Array(64 - hexDigits.length + 1).join('0') + hexDigits;
  }

    // Saturate at 2**256 - 1
  if (hexDigits.length > 64) {
    hexDigits = Array(65).join('f');
  }

  return hexDigits;
}
