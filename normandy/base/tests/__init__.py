import os
import re
from datetime import datetime

from django.contrib.auth.models import Group, User

from factory import fuzzy, Sequence
from factory.django import DjangoModelFactory
import pytest


class Whatever(object):
    def __init__(self, test=lambda x: True, name="unnamed"):
        self.test = test
        self.name = name

    @classmethod
    def startswith(cls, prefix):
        return cls(lambda s: s.startswith(prefix), name=f"startswith {prefix}")

    @classmethod
    def endswith(cls, suffix):
        return cls(lambda s: s.endswith(suffix), name=f"endswith {suffix}")

    @classmethod
    def contains(cls, *values):
        name_values = ", ".join(str(v) for v in values)
        return cls(lambda s: all(value in s for value in values), name=f"contains {name_values}")

    @classmethod
    def iso8601(cls):
        def is_iso8601_date(s):
            if not isinstance(s, str):
                return False
            try:
                datetime.strptime(s, "%Y-%m-%dT%H:%M:%S.%fZ")
                return True
            except ValueError:
                return False

        return cls(is_iso8601_date, name="datetime")

    @classmethod
    def regex(cls, regex):
        return cls(lambda s: re.match(regex, s), name=f"regex {regex}")

    def __eq__(self, other):
        return self.test(other)

    def __repr__(self):
        return f'<{self.__class__.__name__} named "{self.name}">'


class FuzzyUnicode(fuzzy.FuzzyText):
    """A FuzzyText factory that contains at least one non-ASCII character."""

    def __init__(self, prefix="", **kwargs):
        prefix = "%sđ" % prefix
        super(FuzzyUnicode, self).__init__(prefix=prefix, **kwargs)


class FuzzySlug(fuzzy.FuzzyText):
    """A FuzzyText factory that is suitable for slugs."""

    def __init__(self, **kwargs):
        super().__init__(chars="abcdefghijklmnopqrstuvwxyz-", **kwargs)


class UserFactory(DjangoModelFactory):
    username = FuzzyUnicode()
    email = Sequence(lambda n: "test%s@example.com" % n)

    class Meta:
        model = User


class GroupFactory(DjangoModelFactory):
    name = FuzzyUnicode()

    class Meta:
        model = Group


def skip_except_in_ci():
    if "CI" in os.environ:
        raise Exception("This test isn't allowed to be skipped in CI")
    else:
        pytest.skip()


class MigrationTest(object):
    """A base class for migration tests that resets migrations on teardown."""

    @pytest.fixture(autouse=True)
    def _check_migrations_enabled(self, django_db_use_migrations):
        if not django_db_use_migrations:
            skip_except_in_ci()

    @pytest.fixture(autouse=True)
    def _reset_migrations(self, migrations):
        yield
        migrations.reset()


class GQ(object):
    """A helper class to generate GraphQL queries."""

    def __init__(self, type=None, attrs=None, parent=None):
        self._fields = []
        self.type = type
        self.attrs = attrs
        self.parent = parent
        self.child = None

    def fields(self, *args):
        self._fields = args
        return str(self)

    def __getattr__(self, item):
        self.child = GQ(item, parent=self)
        return self.child

    def __call__(self, **kwargs):
        self.attrs = kwargs
        return self

    def __str__(self):
        if self.parent:
            return str(self.parent)
        return self._build()

    def _attrToString(self, attr):
        if isinstance(attr, int):
            return attr
        else:
            return f'"{attr}"'

    def _build(self):
        built = ""

        if self.type:
            built = self.type

        if self.attrs:
            built += "("
            attrs = []
            for k in self.attrs:
                attrs.append(f"{k}: {self._attrToString(self.attrs[k])}")
            built += ", ".join(attrs) + ")"

        wrap = ""
        if self.child:
            wrap = self.child._build()
        elif self._fields:
            wrap = ", ".join(self._fields)

        if wrap:
            if built:
                built += f" {{ {wrap} }}"
            else:
                built += wrap

        return built
