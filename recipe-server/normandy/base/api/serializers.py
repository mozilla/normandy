from django.contrib.auth.models import User

from rest_framework import serializers


class UserSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField()
    first_name = serializers.CharField()
    last_name = serializers.CharField()
    email = serializers.CharField()

    class Meta:
        model = User
        fields = [
            'id',
            'first_name',
            'last_name',
            'email',
        ]


class ServiceInfoSerializer(serializers.Serializer):
    """Data that frontend clients need to interact with the service."""
    github_url = serializers.CharField()
    logout_url = serializers.CharField()
    peer_approval_enforced = serializers.BooleanField()
    experimenter_api_url = serializers.CharField()
    user = UserSerializer()

    class Meta:
        fields = [
            'github_url',
            'logout_url',
            'peer_approval_enforced',
            'experimenter_api_url',
            'user',
        ]
