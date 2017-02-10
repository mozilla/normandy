from django.conf import settings
from django.core.checks import Warning, register as register_check


ERROR_MISCONFIGURED_CDN_URL_SLASH = 'normandy.base.E001'
ERROR_MISCONFIGURED_CDN_URL_HTTPS = 'normandy.base.E002'
ERROR_MISCONFIGURED_APP_SERVER_URL_SLASH = 'normandy.base.E003'
ERROR_MISCONFIGURED_APP_SERVER_URL_HTTPS = 'normandy.base.E004'


def setting_cdn_url(app_configs, **kwargs):
    errors = []

    if settings.CDN_URL is not None:
        if settings.CDN_URL[-1] != '/':
            msg = 'The setting CDN_URL must end in a slash'
            errors.append(Warning(msg, id=ERROR_MISCONFIGURED_CDN_URL_SLASH))

        if not settings.CDN_URL.startswith('https://'):
            msg = 'The setting CDN_URL must be an https URL'
            errors.append(Warning(msg, id=ERROR_MISCONFIGURED_CDN_URL_HTTPS))

    return errors


def setting_app_server_url(app_configs, **kwargs):
    errors = []

    if settings.APP_SERVER_URL is not None:
        if settings.APP_SERVER_URL[-1] != '/':
            msg = 'The setting APP_SERVER_URL must end in a slash'
            errors.append(Warning(msg, id=ERROR_MISCONFIGURED_APP_SERVER_URL_SLASH))

        if not settings.APP_SERVER_URL.startswith('https://'):
            msg = 'The setting APP_SERVER_URL must be an https URL'
            errors.append(Warning(msg, id=ERROR_MISCONFIGURED_APP_SERVER_URL_HTTPS))

    return errors


def register():
    register_check(setting_cdn_url)
