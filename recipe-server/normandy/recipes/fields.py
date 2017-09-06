import hashlib

from django.db import models
from django.core.exceptions import ValidationError


class LocaleField(models.CharField):
    """Legacy field leftover to make earlier migrations work."""
    def __init__(self, *args, **kwargs):
        kwargs.setdefault('max_length', 255)
        kwargs.setdefault('choices', {})
        return super().__init__(*args, **kwargs)


class AutoHashField(models.CharField):
    """
    Generates and stores a hash of another field on the model instance
    when saved.

    Unused field leftover to make earlier migrations work.
    """
    def __init__(self, field_to_hash, *args, **kwargs):
        self.field_to_hash = field_to_hash
        kwargs['max_length'] = 40
        kwargs['editable'] = False
        return super().__init__(*args, **kwargs)

    def pre_save(self, instance, add):
        value_to_hash = getattr(instance, self.field_to_hash).encode('utf-8')
        return hashlib.sha1(value_to_hash).hexdigest()

    def deconstruct(self):
        name, path, args, kwargs = super().deconstruct()
        args.insert(0, self.field_to_hash)
        del kwargs['max_length']
        del kwargs['editable']
        return name, path, args, kwargs


class IdenticonSeedField(models.CharField):
    """Adds validation specific to identicon_seed."""
    def __init__(self, *args, max_length=64, **kwargs):
        return super().__init__(*args, max_length=max_length, **kwargs)

    def to_python(self, value):
        if value is None:
            return super().to_python(value)

        prefix_split = value.split(':')
        if not prefix_split:
            raise ValidationError(f'Invalid identicon_seed "{value}", missing prefix.')
        if prefix_split[0] != 'v1':
            raise ValidationError(
                f'Invalid identicon_seed "{value}", invalid prefix "{prefix_split[0]}".')
        return super().to_python(value)
