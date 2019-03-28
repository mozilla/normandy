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
    all_groups = graphene.List(GroupType)

    def resolve_all_users(self, info, **kwargs):
        return User.objects.all()

    def resolve_all_groups(self, info, **kwargs):
        return Group.objects.all()
