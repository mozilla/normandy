import uuid

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


class ClientParametersFactory(factory.Factory):
    class Meta:
        model = dict

    locale = 'en-US'
    version = '42.0a1'
    release_channel = 'nightly'
    user_id = factory.LazyAttribute(lambda o: uuid.uuid4())
