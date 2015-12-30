from django.core.validators import MinValueValidator, MaxValueValidator
from django.db import models

from product_details import product_details


class LocaleField(models.CharField):
    CHOICES = {
        code: names['English']
        for code, names in product_details.languages.items()
    }

    def __init__(self, *args, **kwargs):
        kwargs.setdefault('max_length', 255)
        kwargs.setdefault('choices', self.CHOICES.items())
        return super(LocaleField, self).__init__(*args, **kwargs)


class PercentField(models.FloatField):
    default_validators = [MinValueValidator(0), MaxValueValidator(100)]
