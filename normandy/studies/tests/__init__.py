import factory
import os

from normandy.base.tests import FuzzyUnicode
from normandy.studies.models import Extension


DATA_DIR = os.path.join(os.path.abspath(os.path.dirname(__file__)), "data")


class ExtensionFactory(factory.DjangoModelFactory):
    name = FuzzyUnicode()
    xpi = factory.django.FileField(from_path=os.path.join(DATA_DIR, "webext-signed.xpi"))

    class Meta:
        model = Extension
