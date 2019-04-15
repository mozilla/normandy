from random import randint

import pytest
from markus import TIMING
from markus.testing import MetricsMock

from normandy.base.middleware import (
    NormandyCommonMiddleware,
    NormandySecurityMiddleware,
    DEBUG_HTTP_TO_HTTPS_REDIRECT,
)


@pytest.fixture
def mock_logger(mocker):
    return mocker.patch("normandy.base.middleware.logger")


class TestNormandyCommonMiddleware(object):
    def test_append_slash_redirects_with_cache_headers(self, rf, settings):
        cache_time = randint(100, 1000)
        # This must be a URL that is valid with a slash but not without a slash
        url = "/api/v1"
        settings.APPEND_SLASH = True
        settings.PERMANENT_REDIRECT_CACHE_TIME = cache_time

        middleware = NormandyCommonMiddleware()
        req = rf.get(url)
        res = middleware.process_request(req)

        assert res is not None
        assert res.status_code == 301
        assert res["Location"] == url + "/"
        cache_control = set(res["Cache-Control"].split(", "))
        assert cache_control == {"public", f"max-age={cache_time}"}


class TestNormandySecurityMiddleware(object):
    @pytest.fixture
    def enable_ssl_redirect(self, settings):
        settings.SECURE_SSL_REDIRECT = True
        settings.SECURE_REDIRECT_EXEMPT = []

    def test_it_works(self, rf, enable_ssl_redirect):
        middleware = NormandySecurityMiddleware()
        req = rf.get("/", secure=False)
        res = middleware.process_request(req)

        assert res is not None
        assert res.status_code == 301
        assert res["Location"].startswith("https:")

    def test_it_includes_cache_headers(self, rf, enable_ssl_redirect, settings):
        cache_time = randint(100, 1000)
        settings.HTTPS_REDIRECT_CACHE_TIME = cache_time

        middleware = NormandySecurityMiddleware()
        req = rf.get("/", secure=False)
        res = middleware.process_request(req)

        cache_control = set(res["Cache-Control"].split(", "))
        assert cache_control == {"public", f"max-age={cache_time}"}

    def test_it_logs(self, rf, enable_ssl_redirect, mock_logger):
        middleware = NormandySecurityMiddleware()
        req = rf.post(
            path="/",
            data="this is the body",
            content_type="text/plain",
            HTTP_X_HELLO="world",
            secure=False,
        )
        middleware.process_request(req)

        mock_logger.debug.assert_called_with(
            "Served HTTP to HTTPS redirect for /",
            extra={
                "code": DEBUG_HTTP_TO_HTTPS_REDIRECT,
                "method": "POST",
                "path": "/",
                "body": "this is the body",
                "headers": {
                    "X_HELLO": "world",
                    "CONTENT_TYPE": "text/plain",
                    "CONTENT_LENGTH": 16,
                    "COOKIE": "",
                },
            },
        )


class TestResponseMetricsMiddleware(object):
    def test_it_sends_a_timer_metric(self, settings, client):
        middleware_name = "normandy.base.middleware.response_metrics_middleware"
        if middleware_name not in settings.MIDDLEWARE:
            settings.MIDDLEWARE.insert(0, middleware_name)

        with MetricsMock() as mm:
            client.get("/api/v3/?query=string")
            mm.print_records()
            assert mm.has_record(
                TIMING,
                stat="normandy.response",
                tags=["status:200", "view:normandy.base.api.views.APIRootView", "method:GET"],
            )
