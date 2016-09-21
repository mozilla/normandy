import pytest


"""These are paths hit by self repair that need to be very fast"""
HOT_PATHS = [
    '/en-US/repair',
    '/en-US/repair/',
    '/api/v1/recipe/',
    '/api/v1/action/',
]


@pytest.mark.parametrize('path', HOT_PATHS)
class TestHotPaths(object):
    """
    Test for performance-enhancing properties of the site.

    This file does not test performance by measuring runtimes and throughput.
    Instead it tests for markers of features that would speed up or slow down the
    site, such as cache headers.
    """

    def test_no_redirects(self, conf, requests_session, path):
        r = requests_session.get(conf.getoption('server') + path)
        r.raise_for_status()
        assert 200 <= r.status_code < 300

    def test_no_vary_cookie(self, conf, requests_session, path, only_readonly):
        r = requests_session.get(conf.getoption('server') + path)
        r.raise_for_status()
        assert 'cookie' not in r.headers.get('vary', '').lower()
