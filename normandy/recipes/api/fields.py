from contextlib import closing

from django.core.files.base import ContentFile

from rest_framework.fields import CharField


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
