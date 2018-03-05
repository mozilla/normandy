class GenericRevisionProperty(object):
    related_field = None

    def __init__(self, method, default=None):
        self.method = method
        self.default = default
        self.__doc__ = method.__doc__

    def __get__(self, instance, owner):
        if not self.related_field:
            raise NotImplementedError('You must set a related field.')
        if not getattr(instance, self.related_field):
            return None
        return self.method(instance)

    def __set__(self, instance, value):
        raise AttributeError('This property is read-only.')

    def __delete__(self, instance):
        raise AttributeError('This property cannot be deleted.')


class CurrentRevisionProperty(GenericRevisionProperty):
    """
    A class to help create class properties that return a default value if an instance of the
    parent class has no `current_revision`.
    """
    related_field = 'current_revision'


def current_revision_property(default=None):
    """
    A decorator that will return a default value if the instance has no `current_revision`
    """
    def decorator(method):
        return CurrentRevisionProperty(method, default)
    return decorator


class ApprovedRevisionProperty(GenericRevisionProperty):
    """
    A class to help create class properties that return a default value if an instance of the
    parent class has no `approved_revision`.
    """
    related_field = 'approved_revision'


def approved_revision_property(default=None):
    """
    A decorator that will return a default value if the instance has no `approved_revision`
    """
    def decorator(method):
        return ApprovedRevisionProperty(method, default)
    return decorator
