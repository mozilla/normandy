from rest_framework import serializers

from normandy.studies.models import Extension


class ExtensionSerializer(serializers.ModelSerializer):
    xpi = serializers.FileField()

    class Meta:
        model = Extension
        fields = ["id", "name", "xpi", "extension_id", "version", "hash", "hash_algorithm"]
        read_only_fields = ["extension_id", "version", "hash", "hash_algorithm"]
        ref_name = "ExtensionSerializerV1"
