import graphene

from normandy.base.schema import Query as BaseQuery
from normandy.recipes.schema import Query as RecipesQuery
from normandy.studies.schema import Query as StudiesQuery


class NormandyQuery(BaseQuery, RecipesQuery, StudiesQuery, graphene.ObjectType):
    pass


schema = graphene.Schema(query=NormandyQuery)
