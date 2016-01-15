import hashlib


def fraction_to_key(frac):
    """Map from the range [0, 1] to [0, max(sha256)]. The result is a string."""
    # SHA 256 hashes are 64 hexadecimal numbers. The largest possible SHA 256
    # hash is 2^64 - 1

    if frac < 0 or frac > 1:
        raise ValueError('frac must be between 0 and 1 inclusive (got {})'.format(frac))

    mult = 2 ** 256 - 1
    in_decimal = int(frac * mult)

    # Saturate at 0
    if in_decimal < 0:
        in_decimal = 0

    hex_digits = hex(in_decimal)[2:]  # Strip off leading "0x"
    padded = "{:0<64}".format(hex_digits)

    # Saturate at 2**256 - 1
    if len(padded) > 64:
        return 'f' * 64
    else:
        return padded


def deterministic_sample(rate, inputs):
    """
    Deterministically choose True or False based for a set of inputs.

    Internally, converts `rate` into a point in the sha256 hash space. If the
    hash of `inputs` is less than that point, it returns True.

    @parameter rate The probability of returning True
    @parameter input A list of hashable data to feed to decide True or False about
    @return True with probability `rate` and False otherwise
    """
    hasher = hashlib.sha256()
    for inp in inputs:
        hasher.update(str(inp).encode('utf8'))

    sample_point = fraction_to_key(rate)
    input_hash = hasher.hexdigest()

    assert len(sample_point) == 64
    assert len(input_hash) == 64

    return input_hash < sample_point
