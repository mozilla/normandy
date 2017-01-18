class ApprovedRevisionProperty(object):
    """
    A class to help create class properties that return None if an instance of the parent class
    has no `approved_revision` and no fallback `latest_revision`.
    """
    def __init__(self, method):
        self.method = method
        self.__doc__ = method.__doc__

    def __get__(self, instance, owner):
        revision = instance.approved_revision or instance.latest_revision
        if not revision:
            return None
        return self.method(instance, revision)

    def __set__(self, instance, value):
        raise AttributeError('This property is read-only.')

    def __delete__(self, instance):
        raise AttributeError('This property cannot be deleted.')


def approved_revision_property(method):
    """
    A decorator that will return None if the instance has no `approved_revision` and no
    `latest_revision` as a fallback.
    """
    return ApprovedRevisionProperty(method)
