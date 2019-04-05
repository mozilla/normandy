from django.contrib.auth.models import Group, User

import graphene

from graphene_django.types import DjangoObjectType


class UserType(DjangoObjectType):
    class Meta:
        model = User


class GroupType(DjangoObjectType):
    class Meta:
        model = Group


class Query(object):
    all_users = graphene.List(UserType)
    user = graphene.Field(
        UserType, id=graphene.Int(), username=graphene.String(), email=graphene.String()
    )
    all_groups = graphene.List(GroupType)
    group = graphene.Field(GroupType, id=graphene.Int(), name=graphene.String())

    def resolve_all_users(self, info):
        return User.objects.all()

    def resolve_user(self, info, id=None, username=None, email=None):
        if id is not None:
            return User.objects.get(id=id)

        if username is not None:
            return User.objects.get(username=username)

        if email is not None:
            return User.objects.get(email=email)

        return None

    def resolve_all_groups(self, info):
        return Group.objects.all()

    def resolve_group(self, info, id=None, name=None):
        if id is not None:
            return Group.objects.get(id=id)

        if name is not None:
            return Group.objects.get(name=name)

        return None
