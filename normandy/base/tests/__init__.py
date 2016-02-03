from django.contrib.auth.models import User

from factory import DjangoModelFactory, fuzzy, Sequence


class Whatever(object):
    def __init__(self, test=lambda x: True):
        self.test = test

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
