import graphene

from normandy.base.schema import Query as BaseQuery
from normandy.recipes.schema import Query as RecipesQuery
from normandy.studies.schema import Query as StudiesQuery


class NormandyQuery(BaseQuery, RecipesQuery, StudiesQuery, graphene.ObjectType):
    pass


class DisableIntrospectionMiddleware:
    """
    This class hides the introspection. As it is best practice to not allow introspection queries
    in production. ref: https://docs.graphene-python.org/en/latest/execution/queryvalidation/#disable-introspection
    """

    def resolve(self, next, root, info, **kwargs):
        # introspection fields taken from https://graphql.org/learn/introspection/
        if info.field_name.lower() in [
            "__schema",
            "__type",
            "__typeKind",
            "__field",
            "__inputValue",
            "__enumValue",
            "__directive",
        ]:
            return None
        return next(root, info, **kwargs)


schema = graphene.Schema(query=NormandyQuery)
