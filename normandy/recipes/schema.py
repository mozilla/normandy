import graphene

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


class Query(object):
    all_actions = graphene.List(ActionType)
    all_approval_requests = graphene.List(ApprovalRequestType)
    all_recipes = graphene.List(RecipeType)
    all_recipe_revisions = graphene.List(RecipeRevisionType)

    def resolve_all_actions(self, info, **kwargs):
        return ActionType.objects.all()

    def resolve_all_approval_requests(self, info, **kwargs):
        return ApprovalRequest.objects.all()

    def resolve_all_recipes(self, info, **kwargs):
        return Recipe.objects.all()

    def resolve_all_recipe_revisions(self, info, **kwargs):
        return RecipeRevision.objects.all()
