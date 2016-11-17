from django.contrib.auth.models import User

from rest_framework import serializers
from rest_framework.authtoken.models import Token


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'first_name',
            'last_name',
            'username',
        ]


class TokenSerializer(serializers.ModelSerializer):
    key = serializers.CharField(read_only=True)
    user = serializers.SlugRelatedField(slug_field='username', read_only=True)
    created = serializers.DateTimeField(read_only=True)

    class Meta:
        model = Token
        fields = [
            'key',
            'user',
            'created',
        ]
