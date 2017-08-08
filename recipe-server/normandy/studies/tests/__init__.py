import factory

from normandy.base.tests import FuzzyUnicode
from normandy.studies.models import Extension


class ExtensionFactory(factory.DjangoModelFactory):
    name = FuzzyUnicode()
    xpi = factory.django.FileField()

    class Meta:
        model = Extension
