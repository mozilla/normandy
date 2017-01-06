from django.conf import settings
from django.core.checks import Warning, register as register_check


WARNING_MISCONFIGURED_CDN_URL = 'normandy.base.W001'


def setting_cdn_url_has_trailing_slash(app_configs, **kwargs):
    errors = []

    if settings.CDN_URL is not None and settings.CDN_URL[-1] != '/':
        msg = 'The setting CDN_URL should end in a slash'
        errors.append(Warning(msg, id=WARNING_MISCONFIGURED_CDN_URL))

    return errors


def register():
    register_check(setting_cdn_url_has_trailing_slash)
