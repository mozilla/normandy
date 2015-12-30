from urllib.parse import parse_qs, urlencode, urlparse, urlunparse


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
