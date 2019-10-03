from rest_framework import serializers


class CapabilitySerializer(serializers.DictField):
    is_baseline = serializers.BooleanField()


class CapabilitiesInfoSerializer(serializers.Serializer):
    """Information about capabilities"""

    capabilities = serializers.DictField(child=CapabilitySerializer())
