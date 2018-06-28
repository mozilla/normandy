from django.conf import settings
from django.core.checks import Error, Warning, register as register_check


WARNING_MISCONFIGURED_OIDC_REMOTE_AUTH_HEADER_PREFIX = "normandy.base.W001"

ERROR_MISCONFIGURED_CDN_URL_SLASH = "normandy.base.E001"
ERROR_MISCONFIGURED_CDN_URL_HTTPS = "normandy.base.E002"
ERROR_MISCONFIGURED_APP_SERVER_URL_SLASH = "normandy.base.E003"
ERROR_MISCONFIGURED_APP_SERVER_URL_HTTPS = "normandy.base.E004"
ERROR_MISCONFIGURED_OIDC_LOGOUT_URL = "normandy.base.E005"


def setting_cdn_url(app_configs, **kwargs):
    errors = []

    if settings.CDN_URL is not None:
        if settings.CDN_URL[-1] != "/":
            msg = "The setting CDN_URL must end in a slash"
            errors.append(Error(msg, id=ERROR_MISCONFIGURED_CDN_URL_SLASH))

        if not settings.CDN_URL.startswith("https://"):
            msg = "The setting CDN_URL must be an https URL"
            errors.append(Error(msg, id=ERROR_MISCONFIGURED_CDN_URL_HTTPS))

    return errors


def setting_app_server_url(app_configs, **kwargs):
    errors = []

    if settings.APP_SERVER_URL is not None:
        if settings.APP_SERVER_URL[-1] != "/":
            msg = "The setting APP_SERVER_URL must end in a slash"
            errors.append(Error(msg, id=ERROR_MISCONFIGURED_APP_SERVER_URL_SLASH))

        if not settings.APP_SERVER_URL.startswith("https://"):
            msg = "The setting APP_SERVER_URL must be an https URL"
            errors.append(Error(msg, id=ERROR_MISCONFIGURED_APP_SERVER_URL_HTTPS))

    return errors


def setting_oidc_remote_auth_header(app_configs, **kwargs):
    errors = []

    if not settings.OIDC_REMOTE_AUTH_HEADER.startswith("HTTP_"):
        msg = "The setting OIDC_REMOTE_AUTH_HEADER should start with HTTP_"
        errors.append(Warning(msg, id=WARNING_MISCONFIGURED_OIDC_REMOTE_AUTH_HEADER_PREFIX))

    return errors


def setting_oidc_logout_url(app_configs, **kwargs):
    errors = []

    if settings.USE_OIDC and settings.OIDC_LOGOUT_URL is None:
        msg = "The setting OIDC_LOGOUT_URL must be set when USE_OIDC=True"
        errors.append(Error(msg, id=ERROR_MISCONFIGURED_OIDC_LOGOUT_URL))

    return errors


def register():
    register_check(setting_cdn_url)
    register_check(setting_app_server_url)
    register_check(setting_oidc_remote_auth_header)
    register_check(setting_oidc_logout_url)
