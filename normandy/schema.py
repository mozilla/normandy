import graphene

from normandy.base.schema import Query as BaseQuery
from normandy.recipes.schema import Query as RecipesQuery
from normandy.studies.schema import Query as StudiesQuery


class NormandyQuery(BaseQuery, RecipesQuery, StudiesQuery, graphene.ObjectType):
    pass


class DisableIntrospectionMiddleware:
    """
    This class hides the introspection.
    """

    def resolve(self, next, root, info, **kwargs):

        if info.field_name.lower() in ['__schema', '_introspection']:
            return None
        return next(root, info, **kwargs)


schema = graphene.Schema(query=NormandyQuery)