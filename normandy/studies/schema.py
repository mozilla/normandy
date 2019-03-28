import graphene

from graphene_django.types import DjangoObjectType

from normandy.studies.models import Extension


class ExtensionType(DjangoObjectType):
    class Meta:
        model = Extension


class Query(object):
    all_extensions = graphene.List(ExtensionType)

    def resolve_all_extensions(self, info, **kwargs):
        return Extension.objects.all()
