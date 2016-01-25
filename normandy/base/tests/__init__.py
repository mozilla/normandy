from factory import fuzzy


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
