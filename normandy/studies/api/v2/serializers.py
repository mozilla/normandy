from rest_framework import serializers

from normandy.studies.api.v2.fields import ExtensionFileField
from normandy.studies.models import Extension


class ExtensionSerializer(serializers.ModelSerializer):
    xpi = ExtensionFileField()

    class Meta:
        model = Extension
        fields = ["id", "name", "xpi"]
