from rest_framework import serializers

from normandy.studies.models import Extension


class ExtensionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Extension
        fields = [
            'id',
            'name',
            'xpi',
        ]
