class LatestRevisionProperty(object):
    """
    A class to help create class properties that return None if an instance of the parent class
    has no `latest_revision`.
    """
    def __init__(self, method):
        self.method = method
        self.__doc__ = method.__doc__

    def __get__(self, instance, owner):
        if not instance.latest_revision:
            return None
        return self.method(instance)

    def __set__(self, instance, value):
        raise AttributeError('This property is read-only.')

    def __delete__(self, instance):
        raise AttributeError('This property cannot be deleted.')


def latest_revision_property(method):
    """
    A decorator that will return None if the instance has no `latest_revision`
    """
    return LatestRevisionProperty(method)
