import base64
from unittest.mock import MagicMock
from random import random
from fractions import Fraction

from django.core.exceptions import ImproperlyConfigured

import pytest

from normandy.recipes.utils import Autographer, fraction_to_key


class TestFractionToKey(object):
    def test_exact(self):
        assert fraction_to_key(Fraction(0, 4)) == '0' * 64
        assert fraction_to_key(Fraction(1, 4)) == '3' + 'f' * 63
        assert fraction_to_key(Fraction(2, 4)) == '7' + 'f' * 63
        assert fraction_to_key(Fraction(3, 4)) == 'b' + 'f' * 63
        assert fraction_to_key(Fraction(4, 4)) == 'f' * 64
        assert fraction_to_key(Fraction(1, 32)) == '07' + 'f' * 62

    def test_floats(self):
        assert fraction_to_key(0.0) == '0' * 64
        assert fraction_to_key(1.0) == 'f' * 64
        # This magic number is 0.00001 * 2**256, in hexadecimal
        assert (fraction_to_key(0.00001) ==
                '0000a7c5ac471b47880000000000000000000000000000000000000000000000')

    @pytest.mark.parametrize('bad_val', [-1, -0.5, 1.5, 2])
    def test_error_cases(self, bad_val):
        with pytest.raises(ValueError) as exc:
            fraction_to_key(bad_val)

        # Check that it is the expected error, not some spurious error from elsewhere.
        assert 'must be between 0 and 1 inclusive' in str(exc)
        # Check that the bad value is mentioned
        assert str(bad_val) in str(exc)

    def test_result_length(self):
        for _ in range(100):
            r = random()
            key = fraction_to_key(r)
            assert len(key) == 64


class TestAutographer(object):
    test_settings = {
        'URL': 'https://autograph.example.com/',
        'HAWK_ID': 'hawk id',
        'HAWK_SECRET_KEY': 'hawk secret key',
    }

    def test_it_checks_settings(self, settings):
        """Test that each required key is required individually"""
        for key in self.test_settings.keys():
            settings.AUTOGRAPH = dict(self.test_settings)  # make a copy
            settings.AUTOGRAPH[key] = None
            with pytest.raises(ImproperlyConfigured) as exc:
                Autographer()
            assert key in str(exc)

        settings.AUTOGRAPH = self.test_settings
        # assert doesn't raise
        Autographer()

    def test_it_makes_good_requests(self, settings):
        settings.AUTOGRAPH = self.test_settings
        autographer = Autographer()
        autographer._session = MagicMock()

        url = self.test_settings['URL'] + 'sign/data'
        foo_base64 = base64.b64encode(b'foo').decode('utf8')
        bar_base64 = base64.b64encode(b'bar').decode('utf8')

        autographer.sign_data(['foo', 'bar'])
        assert autographer.session.post.called_once_with(
            [url, [
                {'template': 'content-signature', 'input': foo_base64},
                {'template': 'content-signature', 'input': bar_base64},
            ]]
        )
