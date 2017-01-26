import json
from datetime import datetime
from urllib.parse import parse_qs, urlencode, urlparse, urlunparse

from django.conf import settings
from django.db.models import Count
from django.utils import timezone


def aware_datetime(*args, **kwargs):
    """Return an aware datetime using Django's configured timezone."""
    return timezone.make_aware(datetime(*args, **kwargs))


def urlparams(url, fragment=None, **kwargs):
    """
    Add a fragment and/or query parameters to a URL.

    Existing query string parameters are preserved, unless they conflict
    with the new parameters, in which case they're overridden.
    """
    parsed = urlparse(url)
    query = dict(parse_qs(parsed.query), **kwargs)
    return urlunparse((
        parsed.scheme,
        parsed.netloc,
        parsed.path,
        parsed.params,
        urlencode(query, doseq=True),
        fragment if fragment is not None else parsed.fragment
    ))


def get_client_ip(request):
    """
    Get a client's IP address from a request.

    If settings.NUM_PROXIES is 0, reads directly from REMOTE_ADDR. If
    settings.NUM_PROXIES is non-zero, parses X-Forwarded-For header
    based on the number of proxies.
    """
    if settings.NUM_PROXIES == 0:
        return request.META.get('REMOTE_ADDR')
    else:
        try:
            ips = request.META.get('HTTP_X_FORWARDED_FOR', '').split(',')
            ips = [ip.strip() for ip in ips]
            return ips[-settings.NUM_PROXIES]
        except IndexError:
            return None


def canonical_json_dumps(data):
    return json.dumps(data, ensure_ascii=True, separators=(',', ':'), sort_keys=True)


def filter_m2m(qs, field, values):
    """
    Filters a queryset by an exact list of many to many relations.
    """
    values = list(values)

    qs = qs.annotate(_count=Count(field)).filter(_count=len(values))

    if len(values):
        qs = qs.filter(**{'{}__in'.format(field): values})

    return qs
