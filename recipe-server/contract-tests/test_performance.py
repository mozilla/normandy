import pytest

from pytest_testrail.plugin import testrail

"""These are paths hit by self repair that need to be very fast"""
HOT_PATHS = [
    '/en-US/repair',
    '/en-US/repair/',
    '/api/v1/recipe/?enabled=1',
    '/api/v1/recipe/signed/?enabled=1',
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

    @testrail('C9490')
    def test_no_redirects(self, conf, requests_session, path):
        r = requests_session.get(conf.getoption('server') + path)
        r.raise_for_status()
        assert 200 <= r.status_code < 300

    @testrail('C9491')
    def test_no_vary_cookie(self, conf, requests_session, path, only_readonly):
        r = requests_session.get(conf.getoption('server') + path)
        r.raise_for_status()
        assert 'cookie' not in r.headers.get('vary', '').lower()

    def test_cache_headers(self, conf, requests_session, path, only_readonly):
        r = requests_session.get(conf.getoption('server') + path)
        r.raise_for_status()
        cache_control = r.headers.get('cache-control')
        assert cache_control is not None

        # parse cache-control header.
        parts = [part.strip() for part in cache_control.split(',')]
        max_age = [part for part in parts if part.startswith('max-age=')][0]
        max_age_seconds = int(max_age.split('=')[1])
        assert 'public' in parts
        assert max_age_seconds > 0
