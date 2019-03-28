from graphene_django.types import DjangoObjectType

from normandy.recipes.models import (
    Action,
    ApprovalRequest,
    Channel,
    Country,
    EnabledState,
    Locale,
    Recipe,
    RecipeRevision,
    Signature,
)


class ActionType(DjangoObjectType):
    class Meta:
        model = Action


class ApprovalRequestType(DjangoObjectType):
    class Meta:
        model = ApprovalRequest


class ChannelType(DjangoObjectType):
    class Meta:
        model = Channel


class CountryType(DjangoObjectType):
    class Meta:
        model = Country


class EnabledStateType(DjangoObjectType):
    class Meta:
        model = EnabledState


class LocaleType(DjangoObjectType):
    class Meta:
        model = Locale


class RecipeType(DjangoObjectType):
    class Meta:
        model = Recipe


class RecipeRevisionType(DjangoObjectType):
    class Meta:
        model = RecipeRevision


class SignatureType(DjangoObjectType):
    class Meta:
        model = Signature
