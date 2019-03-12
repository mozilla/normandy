from urllib.parse import urljoin

import html5lib
import pytest
from pytest_testrail.plugin import pytestrail


"""These are paths hit by self repair that need to be very fast"""
HOT_PATHS = {
    "/en-US/repair",
    "/en-US/repair/",
    "/api/v1/recipe/?enabled=1",
    "/api/v1/recipe/signed/?enabled=1",
    "/api/v1/action/",
}


@pytest.mark.parametrize("path", HOT_PATHS)
class TestHotPaths(object):
    """
    Test for performance-enhancing properties of the site.

    This file does not test performance by measuring runtimes and throughput.
    Instead it tests for markers of features that would speed up or slow down the
    site, such as cache headers.
    """

    @pytestrail.case("C9490")
    def test_no_redirects(self, conf, requests_session, path):
        r = requests_session.get(conf.getoption("server") + path)
        r.raise_for_status()
        assert 200 <= r.status_code < 300

    @pytestrail.case("C9491")
    def test_no_vary_cookie(self, conf, requests_session, path, only_readonly):
        r = requests_session.get(conf.getoption("server") + path)
        r.raise_for_status()
        assert "cookie" not in r.headers.get("vary", "").lower()

    def test_cache_headers(self, conf, requests_session, path, only_readonly):
        if path.startswith("/api/"):
            pytest.xfail("caching temporarily hidden on api by nginx")
        r = requests_session.get(conf.getoption("server") + path)
        r.raise_for_status()
        cache_control = r.headers.get("cache-control")
        assert cache_control is not None

        # parse cache-control header.
        parts = [part.strip() for part in cache_control.split(",")]
        max_age = [part for part in parts if part.startswith("max-age=")][0]
        max_age_seconds = int(max_age.split("=")[1])
        assert "public" in parts
        assert max_age_seconds > 0


def test_static_cache_headers(conf, requests_session):
    """Test that all scripts included from self-repair have long lived cache headers"""
    req = requests_session.get(conf.getoption("server") + "/en-US/repair")
    req.raise_for_status()
    document = html5lib.parse(req.content, treebuilder="dom")
    scripts = document.getElementsByTagName("script")
    for script in scripts:
        src = script.getAttribute("src")
        url = urljoin(conf.getoption("server"), src)
        script_req = requests_session.get(url)
        script_req.raise_for_status()
        cache_control = parse_cache_control(script_req.headers["cache-control"])
        assert cache_control["public"], f"Cache-control: public for {url}"
        ONE_YEAR = 31_536_000
        assert cache_control["max-age"] >= ONE_YEAR, f"Cache-control: max-age > 1 year for {url}"
        assert cache_control["immutable"], f"Cache-control: immutable for {url}"


def parse_cache_control(header):
    parsed = {}
    parts = header.split(",")
    for part in parts:
        part = part.strip()
        if "=" in part:
            key, val = part.split("=", 1)
            try:
                val = int(val)
            except ValueError:
                pass
            parsed[key] = val
        else:
            parsed[part] = True
    return parsed
