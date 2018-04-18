from contextlib import closing

from django.conf import settings
from django.core.files.base import ContentFile

from rest_framework.fields import CharField
from rest_framework.reverse import reverse
from rest_framework.serializers import HyperlinkedIdentityField


class ContentFileField(CharField):
    """Serializer field that deserializes text into a ContentFile."""
    def __init__(self, **kwargs):
        self.filename = kwargs.pop('filename', 'file.txt')
        super().__init__(**kwargs)

    def to_internal_value(self, data):
        return ContentFile(data.encode('utf-8'), name=self.filename)

    def to_representation(self, value):
        value.open()
        with closing(value) as value:
            return value.read().decode('utf-8')


class ActionImplementationHyperlinkField(HyperlinkedIdentityField):
    """
    Serializer field for actions that links to their implementation.

    This includes hashes and possibly redirects to the CDN.
    """
    def __init__(self, view_name='recipes:action-implementation', **kwargs):
        super().__init__(view_name=view_name, **kwargs)

    def get_url(self, obj, view_name, request, format):
        if not obj.implementation:
            return None
        kwargs = {'name': obj.name, 'impl_hash': obj.implementation_hash}

        if settings.CDN_URL is None:
            return reverse(view_name, kwargs=kwargs, request=request, format=format)
        else:
            request = None
            url = reverse(view_name, kwargs=kwargs, request=request, format=format)
            assert url[0] == '/'
            return settings.CDN_URL + url[1:]

    def to_representation(self, value):
        # HyperlinkedIdentityField demands a request when creating
        # urls, but one is not always available. Instead of erroring
        # out hard, fake it.
        if 'request' not in self.context:
            self.context['request'] = None
        return super().to_representation(value)
