import factory

from normandy.bundler.models import Bundle


class BundleFactory(factory.Factory):
    class Meta:
        model = Bundle
