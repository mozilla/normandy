class LatestRevisionProperty(object):
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
    return LatestRevisionProperty(method)
