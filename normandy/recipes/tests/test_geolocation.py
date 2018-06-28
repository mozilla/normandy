import pytest
from geoip2.errors import GeoIP2Error

from normandy.base.tests import Whatever
from normandy.recipes.geolocation import (
    load_geoip_database,
    WARNING_CANNOT_LOAD_DATABASE,
    WARNING_UNKNOWN_GEOIP_ERROR,
)


@pytest.fixture
def mock_logger(mocker):
    return mocker.patch("normandy.recipes.geolocation.logger")


class TestGetCountryCode(object):
    def test_it_works(self, geolocation):
        assert geolocation.get_country_code("207.126.102.129") == "US"

    def test_it_handles_unknown_ips(self, geolocation):
        # MaxMind doesn't have 127.0.0.1 in it's DB. For good reason.
        assert geolocation.get_country_code("127.0.0.1") is None

    def test_it_logs_when_geoip_fails(self, geolocation, mocker, mock_logger):
        mock_reader = mocker.patch("normandy.recipes.geolocation.geoip_reader")
        mock_reader.country.side_effect = GeoIP2Error()

        assert geolocation.get_country_code("207.126.102.129") is None
        mock_logger.warning.assert_called_with(
            Whatever(), extra={"code": WARNING_UNKNOWN_GEOIP_ERROR}
        )


class TestLoadGeoIPDatabase(object):
    def test_it_warns_when_cant_load_database(self, mocker, mock_logger):
        MockReader = mocker.patch("normandy.recipes.geolocation.Reader")
        MockReader.side_effect = IOError()

        load_geoip_database()
        mock_logger.warning.assert_called_with(
            Whatever(), extra={"code": WARNING_CANNOT_LOAD_DATABASE}
        )
