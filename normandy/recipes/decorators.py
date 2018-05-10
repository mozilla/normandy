class RelatedFieldProperty(object):
    """
    A class to help create class properties that return a default value if an instance of the
    parent class has an empty related field.
    """
    def __init__(self, method, related_field, default=None):
        self.method = method
        self.default = default
        self.related_field = related_field
        self.__doc__ = method.__doc__

    def __get__(self, instance, owner):
        if not getattr(instance, self.related_field):
            return None
        return self.method(instance)

    def __set__(self, instance, value):
        raise AttributeError('This property is read-only.')

    def __delete__(self, instance):
        raise AttributeError('This property cannot be deleted.')


def current_revision_property(default=None):
    """
    A decorator that will return a default value if the instance has no `current_revision`
    """
    def decorator(method):
        return RelatedFieldProperty(method, related_field='current_revision', default=default)
    return decorator


def approved_revision_property(default=None):
    """
    A decorator that will return a default value if the instance has no `approved_revision`
    """
    def decorator(method):
        return RelatedFieldProperty(method, related_field='approved_revision', default=default)
    return decorator
