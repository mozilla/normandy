import re

from django.contrib.admindocs.views import simplify_regex

from rest_framework.compat import URLPattern, URLResolver, get_original_route


_PATH_PARAMETER_COMPONENT_RE = re.compile(r"<(?:(?P<converter>[^>:]+):)?(?P<parameter>\w+)>")


def is_api_view(callback):
    """
    Return `True` if the given view callback is a REST framework view/viewset.
    """
    # Avoid import cycle on APIView
    from rest_framework.views import APIView

    cls = getattr(callback, "cls", None)
    return (cls is not None) and issubclass(cls, APIView)


def get_path_from_regex(path_regex):
    """
    Given a URL conf regex, return a URI template string.
    """
    path = simplify_regex(path_regex)

    # Strip Django 2.0 convertors as they are incompatible with uritemplate format
    path = re.sub(_PATH_PARAMETER_COMPONENT_RE, r"{\g<parameter>}", path)
    return path


def should_include_endpoint(path, callback):
    """
    Return `True` if the given endpoint should be included.
    """
    if not is_api_view(callback):
        return False  # Ignore anything except REST framework views.

    if callback.cls.schema is None:
        return False

    if "schema" in callback.initkwargs:
        if callback.initkwargs["schema"] is None:
            return False

    if path.endswith(".{format}") or path.endswith(".{format}/"):
        return False  # Ignore .json style URLs.

    return True


def get_allowed_methods(callback):
    """
    Return a list of the valid HTTP methods for this endpoint.
    """
    if hasattr(callback, "actions"):
        actions = set(callback.actions)
        http_method_names = set(callback.cls.http_method_names)
        methods = [method.upper() for method in actions & http_method_names]
    else:
        methods = callback.cls().allowed_methods

    return [method for method in methods if method not in ("OPTIONS", "HEAD")]


def get_api_endpoints(patterns=None, namespace="", prefix=""):
    """
    Return a list of all available API endpoints by inspecting the URL conf.
    """
    api_endpoints = []

    for pattern in patterns:
        path_regex = prefix + get_original_route(pattern)

        if isinstance(pattern, URLPattern):
            path = get_path_from_regex(path_regex)
            callback = pattern.callback
            if should_include_endpoint(path, callback):
                for method in get_allowed_methods(callback):
                    endpoint = {
                        "path": path,
                        "method": method,
                        "pattern": pattern,
                        "namespace": namespace,
                    }
                    api_endpoints.append(endpoint)

        elif isinstance(pattern, URLResolver):
            if namespace and pattern.namespace:
                pattern_namespace = f"{namespace}:{pattern.namespace}"
            elif namespace:
                pattern_namespace = namespace
            else:
                pattern_namespace = pattern.namespace

            nested_endpoints = get_api_endpoints(
                patterns=pattern.url_patterns, prefix=path_regex, namespace=pattern_namespace
            )
            api_endpoints.extend(nested_endpoints)

    return api_endpoints
