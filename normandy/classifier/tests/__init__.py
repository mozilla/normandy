import factory

from django.test import RequestFactory

from normandy.classifier.models import Bundle, Client


class BundleFactory(factory.Factory):
    class Meta:
        model = Bundle


class ClientFactory(factory.Factory):
    class Meta:
        model = Client

    request = factory.LazyAttribute(lambda o: RequestFactory().get('/'))
