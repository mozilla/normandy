from fractions import Fraction

from normandy.classifier.utils import fraction_to_key


def test_fraction_to_key_exact():
    assert fraction_to_key(Fraction(0, 4)) == '0' * 64
    assert fraction_to_key(Fraction(1, 4)) == '3' + 'f' * 63
    assert fraction_to_key(Fraction(2, 4)) == '7' + 'f' * 63
    assert fraction_to_key(Fraction(3, 4)) == 'b' + 'f' * 63
    assert fraction_to_key(Fraction(4, 4)) == 'f' * 64


def test_fraction_to_key_floats():
    assert fraction_to_key(0.0) == '0' * 64
    assert fraction_to_key(1.0) == 'f' * 64
