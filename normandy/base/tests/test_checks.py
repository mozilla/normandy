import pytest

from django.core.checks.registry import run_checks

from normandy.base import checks as base_checks
from normandy.recipes import checks as recipe_checks, geolocation as geolocation_module


@pytest.mark.django_db
def test_run_checks_happy_path():
    errors = set(e.id for e in run_checks())
    expected = set()

    # If geolocation isn't enabled, expect that their is a geolocation warning
    geolocation_module.load_geoip_database()
    if geolocation_module.geoip_reader is None:
        expected.add(recipe_checks.ERROR_GEOIP_DB_NOT_AVAILABLE)

    assert errors == expected


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
    assert base_checks.ERROR_MISCONFIGURED_CDN_URL_SLASH in error_ids
    assert base_checks.ERROR_MISCONFIGURED_CDN_URL_HTTPS in error_ids
    assert base_checks.ERROR_MISCONFIGURED_APP_SERVER_URL_SLASH in error_ids
    assert base_checks.ERROR_MISCONFIGURED_APP_SERVER_URL_HTTPS in error_ids
    assert base_checks.ERROR_MISCONFIGURED_OIDC_LOGOUT_URL in error_ids
    assert base_checks.WARNING_MISCONFIGURED_OIDC_REMOTE_AUTH_HEADER_PREFIX in error_ids
