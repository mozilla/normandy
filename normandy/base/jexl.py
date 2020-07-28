from pyjexl import JEXL


_cached_jexl = None


def get_normandy_jexl():
    global _cached_jexl
    if not _cached_jexl:
        _cached_jexl = JEXL()

        # Add mock transforms for validation. See
        # https://mozilla.github.io/normandy/user/filters.html#transforms
        # for a list of what transforms we expect to be available.
        transforms = [
            "bucketSample",
            "date",
            "keys",
            "length",
            "mapToProperty",
            "preferenceExists",
            "preferenceIsUserSet",
            "preferenceValue",
            "regExpMatch",
            "stableSample",
            "versionCompare",
        ]
        for transform in transforms:
            _cached_jexl.add_transform(transform, lambda x: x)

    return _cached_jexl
