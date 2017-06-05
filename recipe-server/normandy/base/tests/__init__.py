import os
import re
from datetime import datetime

from django.contrib.auth.models import User

from factory import DjangoModelFactory, fuzzy, Sequence
import pytest


class Whatever(object):
    def __init__(self, test=lambda x: True, name='unnamed'):
        self.test = test
        self.name = name

    @classmethod
    def startswith(cls, prefix):
        return cls(lambda s: s.startswith(prefix), name=f'startswith {prefix}')

    @classmethod
    def endswith(cls, suffix):
        return cls(lambda s: s.endswith(suffix), name=f'endswith {suffix}')

    @classmethod
    def contains(cls, *values):
        name_values = ''.join(str(v) for v in values)
        return cls(lambda s: all(value in s for value in values), name=f'contains {name_values}')

    @classmethod
    def iso8601(cls):
        def is_iso8601_date(s):
            # Will throw is it does not match
            d = datetime.strptime(s, '%Y-%m-%dT%H:%M:%S.%fZ')
            return True

        return cls(is_iso8601_date, name='datetime')

    @classmethod
    def regex(cls, regex):
        return cls(lambda s: re.match(regex, s), name=f'regex {regex}')

    def __eq__(self, other):
        return self.test(other)

    def __repr__(self):
        return f'<{self.__class__.__name__} named "{self.name}">'


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
