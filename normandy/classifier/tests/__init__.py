import factory

from normandy.classifier.models import Bundle


class BundleFactory(factory.Factory):
    class Meta:
        model = Bundle
