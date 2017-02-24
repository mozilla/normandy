import os

from django.contrib.auth.models import User

from factory import DjangoModelFactory, fuzzy, Sequence
import pytest


class Whatever(object):
    def __init__(self, test=lambda x: True):
        self.test = test

    @classmethod
    def endswith(cls, suffix):
        return cls(lambda s: s.endswith(suffix))

    @classmethod
    def contains(cls, *values):
        return cls(lambda s: all(value in s for value in values))

    def __eq__(self, other):
        return self.test(other)


class FuzzyUnicode(fuzzy.FuzzyText):
    """A FuzzyText factory that contains at least one non-ASCII character."""

    def __init__(self, prefix=u'', **kwargs):
        prefix = '%sđ' % prefix
        super(FuzzyUnicode, self).__init__(prefix=prefix, **kwargs)


class UserFactory(DjangoModelFactory):
    username = FuzzyUnicode()
    email = Sequence(lambda n: 'test%s@example.com' % n)

    class Meta:
        model = User


def skip_except_in_ci():
    if 'CI' in os.environ:
        raise Exception("This test isn't allowed to be skipped in CI")
    else:
        pytest.skip()
