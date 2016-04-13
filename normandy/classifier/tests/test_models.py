from unittest.mock import patch

import pytest

from normandy.classifier.models import Client


class TestClassifier(object):
    @pytest.mark.parametrize('x_forwarded_for,expected_ip', [
        ('192.0.2.0,127.0.0.1', '192.0.2.0'),
        ('192.0.2.0', '192.0.2.0'),
    ])
    def test_country_x_forwarded_for(self, rf, x_forwarded_for, expected_ip):
        client = Client(rf.get('/', HTTP_X_FORWARDED_FOR=x_forwarded_for))

        with patch('normandy.classifier.models.get_country_code') as get_country_code:
            assert client.country == get_country_code.return_value
            get_country_code.assert_called_with(expected_ip)

    def test_country_remote_addr_fallback(self, rf):
        client = Client(rf.get('/', REMOTE_ADDR='192.0.2.0'))

        with patch('normandy.classifier.models.get_country_code') as get_country_code:
            assert client.country == get_country_code.return_value
            get_country_code.assert_called_with('192.0.2.0')
