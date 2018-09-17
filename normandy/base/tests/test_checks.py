import pytest

from django.core.checks.registry import run_checks

from normandy.base import checks


@pytest.mark.django_db
def test_run_checks_happy_path():
    errors = run_checks()
    assert errors == []


@pytest.mark.django_db
def test_run_checks_all_things_that_can_go_wrong(settings):
    settings.CDN_URL = "http://cdn.example.com"
    settings.APP_SERVER_URL = "http://app.example.com"
    settings.OIDC_REMOTE_AUTH_HEADER = "Y_HTTP_HEADER"
    settings.OIDC_LOGOUT_URL = None
    settings.USE_OIDC = True
    errors = run_checks()
    assert errors != []
    error_ids = [x.id for x in errors]
    assert checks.ERROR_MISCONFIGURED_CDN_URL_SLASH in error_ids
    assert checks.ERROR_MISCONFIGURED_CDN_URL_HTTPS in error_ids
    assert checks.ERROR_MISCONFIGURED_APP_SERVER_URL_SLASH in error_ids
    assert checks.ERROR_MISCONFIGURED_APP_SERVER_URL_HTTPS in error_ids
    assert checks.ERROR_MISCONFIGURED_OIDC_LOGOUT_URL in error_ids
    assert checks.WARNING_MISCONFIGURED_OIDC_REMOTE_AUTH_HEADER_PREFIX in error_ids
