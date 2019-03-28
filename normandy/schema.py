import graphene

from normandy.recipes.schema import Query as RecipesQuery


class NormandyQuery(RecipesQuery, graphene.ObjectType):
    pass


schema = graphene.Schema(query=NormandyQuery)
