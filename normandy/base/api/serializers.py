from django.contrib.auth.models import Group, User

from rest_framework import serializers


class UserOnlyNamesSerializer(serializers.ModelSerializer):
    first_name = serializers.CharField()
    last_name = serializers.CharField()

    class Meta:
        model = User
        fields = ["id", "first_name", "last_name"]


class UserSerializer(UserOnlyNamesSerializer):
    email = serializers.CharField()

    class Meta:
        model = User
        fields = ["id", "first_name", "last_name", "email"]

    def create(self, validated_data):
        # Username should be the same as email
        validated_data["username"] = validated_data.get("email")
        return super().create(validated_data)


class GroupSerializer(serializers.ModelSerializer):
    name = serializers.CharField()

    class Meta:
        model = Group
        fields = ["id", "name"]


class UserWithGroupsSerializer(UserSerializer):
    groups = GroupSerializer(read_only=True, many=True)

    class Meta:
        model = User
        fields = ["id", "first_name", "last_name", "email", "groups"]


class ServiceInfoSerializer(serializers.Serializer):
    """Data that frontend clients need to interact with the service."""

    github_url = serializers.CharField()
    logout_url = serializers.CharField()
    peer_approval_enforced = serializers.BooleanField()
    user = UserSerializer()

    class Meta:
        fields = ["github_url", "logout_url", "peer_approval_enforced", "user"]
