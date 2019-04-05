import graphene

from graphene_django.types import DjangoObjectType

from normandy.studies.models import Extension


class ExtensionType(DjangoObjectType):
    class Meta:
        model = Extension


class Query(object):
    all_extensions = graphene.List(ExtensionType)
    extension = graphene.Field(ExtensionType, id=graphene.Int())

    def resolve_all_extensions(self, info):
        return Extension.objects.all()

    def resolve_extension(self, info, id=None):
        if id is not None:
            return Extension.objects.get(id=id)

        return None
