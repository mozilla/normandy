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
    action = graphene.Field(ActionType, id=graphene.Int(), name=graphene.String())
    all_approval_requests = graphene.List(ApprovalRequestType)
    approval_request = graphene.Field(ApprovalRequestType, id=graphene.Int())
    all_recipes = graphene.List(RecipeType)
    recipe = graphene.Field(RecipeType, id=graphene.Int())
    all_recipe_revisions = graphene.List(RecipeRevisionType)
    recipe_revision = graphene.Field(RecipeRevisionType, id=graphene.Int())

    def resolve_all_actions(self, info, **kwargs):
        return Action.objects.all()

    def resolve_action(self, info, **kwargs):
        id = kwargs.get("id")
        name = kwargs.get("name")

        if id is not None:
            return Action.objects.get(id=id)

        if name is not None:
            return Action.objects.get(name=name)

        return None

    def resolve_all_approval_requests(self, info, **kwargs):
        return ApprovalRequest.objects.all()

    def resolve_approval_request(self, info, **kwargs):
        id = kwargs.get("id")

        if id is not None:
            return ApprovalRequest.objects.get(id=id)

        return None

    def resolve_all_recipes(self, info, **kwargs):
        return Recipe.objects.all()

    def resolve_recipe(self, info, **kwargs):
        id = kwargs.get("id")

        if id is not None:
            return Recipe.objects.get(id=id)

        return None

    def resolve_all_recipe_revisions(self, info, **kwargs):
        return RecipeRevision.objects.all()

    def resolve_recipe_revision(self, info, **kwargs):
        id = kwargs.get("id")

        if id is not None:
            return RecipeRevision.objects.get(id=id)

        return None
