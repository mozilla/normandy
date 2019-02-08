import pytest

from normandy.studies.api.v3.serializers import ExtensionSerializer
from normandy.studies.tests import ExtensionFactory


@pytest.mark.django_db()
class TestExtensionSerializer:
    def test_it_works(self, storage):
        extension = ExtensionFactory()
        serializer = ExtensionSerializer(extension)

        assert serializer.data == {
            "id": extension.id,
            "name": extension.name,
            "xpi": extension.xpi.url,
            "extension_id": extension.extension_id,
            "version": extension.version,
            "hash": extension.hash,
            "hash_algorithm": extension.hash_algorithm,
        }
