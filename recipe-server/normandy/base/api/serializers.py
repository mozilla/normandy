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


class ServiceInfoSerializer(serializers.ModelSerializer):
    user = UserSerializer();
    peer_approval_enforced = serializers.BooleanField()

    class Meta:
        model = User
        fields = [
            'user',
            'peer_approval_enforced',
        ]
