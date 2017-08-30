import string

import pytest

from normandy.base.genome import Genome


@pytest.fixture
def genome():
    chromosome = 22277881858223168760577094993432003545014764014755939081779254564492314720067
    entropy = 256
    return Genome(chromosome, entropy)


class TestGenome(object):
    """
    Tests the Genome module by setting the seed to a known value and making sure that the
    random choices remain consistent, ie. they do not change over time.
    """
    def test_take(self, genome):
        take_values = [
            genome.take(5),
            genome.take(8),
            genome.take(13),
        ]
        assert take_values == [2, 5, 11]

    def test_choice(self, genome):
        options = string.ascii_letters
        choice_values = [
            genome.choice(options),
            genome.choice(options),
            genome.choice(options),
        ]
        assert choice_values == ['Z', 'O', 't']

    def test_weighted_choice(self, genome):
        weighted_options = [
            {'weight': 1, 'value': 'apple'},
            {'weight': 2, 'value': 'orange'},
            {'weight': 4, 'value': 'strawberry'},
        ]
        weighted_choice_values = [
            genome.weighted_choice(weighted_options),
            genome.weighted_choice(weighted_options),
            genome.weighted_choice(weighted_options),
        ]
        assert weighted_choice_values == [
            {'weight': 4, 'value': 'strawberry'},
            {'weight': 1, 'value': 'apple'},
            {'weight': 4, 'value': 'strawberry'}
        ]

    def test_int(self, genome):
        int_values = [
            genome.int(0, 200),
            genome.int(0, 200),
            genome.int(0, 200),
        ]
        assert int_values == [67, 0, 68]

    def test_float(self, genome):
        float_values = [
            genome.float(0, 200, precision=4),
            genome.float(0, 200, precision=4),
            genome.float(0, 200, precision=4),
        ]
        assert float_values == [150.0, 0.0, 0.0]

    def test_letter(self, genome):
        letter_values = [
            genome.letter(),
            genome.letter(),
            genome.letter(),
        ]
        assert letter_values == ['Z', 'D', 'B']

    def test_emoji(self, genome):
        emoji_values = [
            genome.emoji(),
            genome.emoji(),
            genome.emoji(),
        ]
        assert emoji_values == ['😚', '😚', '🎁']

    def test_color(self, genome):
        color_values = [
            genome.color().get_rgb_color(),
            genome.color().get_rgb_color(),
            genome.color().get_rgb_color(),
        ]
        print(color_values)
        assert color_values == [
            (0x65, 0x7b, 0x83),
            (0x83, 0x94, 0x96),
            (0xfd, 0xf6, 0xe3)
        ]
