import json
from base64 import b64encode, urlsafe_b64encode
from datetime import datetime
from hashlib import sha384
from urllib.parse import parse_qs, urlencode, urlparse, urlunparse

from django.conf import settings
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
    return urlunparse(
        (
            parsed.scheme,
            parsed.netloc,
            parsed.path,
            parsed.params,
            urlencode(query, doseq=True),
            fragment if fragment is not None else parsed.fragment,
        )
    )


def get_client_ip(request):
    """
    Get a client's IP address from a request.

    If settings.NUM_PROXIES is 0, reads directly from REMOTE_ADDR. If
    settings.NUM_PROXIES is non-zero, parses X-Forwarded-For header
    based on the number of proxies.
    """
    if settings.NUM_PROXIES == 0:
        return request.META.get("REMOTE_ADDR")
    else:
        try:
            ips = request.META.get("HTTP_X_FORWARDED_FOR", "").split(",")
            ips = [ip.strip() for ip in ips]
            return ips[-settings.NUM_PROXIES]
        except IndexError:
            return None


def canonical_json_dumps(data):
    return json.dumps(data, ensure_ascii=True, separators=(",", ":"), sort_keys=True)


def sri_hash(data, url_safe=False):
    """
    Return a subresource integrity attribute string for a file
    containing the given binary data.

    SRI attributes are a string of the form "{algorithm}-{hash}", where
    {algorithm} is the hash algorithm, and {hash} is a base64-encoded
    hash of the data using the specified algorithm.

    :param data:
        Bytes-like object containing the data to hash.
    """
    digest = sha384(data).digest()
    if url_safe:
        data_hash = urlsafe_b64encode(digest)
    else:
        data_hash = b64encode(digest)
    return "sha384-" + data_hash.decode()
