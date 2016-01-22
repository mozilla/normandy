import hashlib

from django.core.validators import MinValueValidator, MaxValueValidator
from django.db import models

from product_details import product_details


class LocaleField(models.CharField):
    """Legacy field leftover to make earlier migrations work."""
    CHOICES = {
        code: names['English']
        for code, names in product_details.languages.items()
    }

    def __init__(self, *args, **kwargs):
        kwargs.setdefault('max_length', 255)
        kwargs.setdefault('choices', self.CHOICES.items())
        return super().__init__(*args, **kwargs)


class PercentField(models.FloatField):
    default_validators = [MinValueValidator(0), MaxValueValidator(100)]


class AutoHashField(models.CharField):
    """
    Generates and stores a hash of another field on the model instance
    when saved.
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
