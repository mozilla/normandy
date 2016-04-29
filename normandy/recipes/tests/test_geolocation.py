class TestGetCountryCode:
    def test_it_works(self, geolocation):
        assert geolocation.get_country_code('207.126.102.129') == 'US'

    def test_it_handles_unknown_ips(self, geolocation):
        # MaxMind doesn't have 127.0.0.1 in it's DB. For good reason.
        assert geolocation.get_country_code('127.0.0.1') is None
