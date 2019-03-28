import graphene

from normandy.recipes.gql import schema as recipes_schema


class Query(recipes_schema.Query, graphene.ObjectType):
    pass


schema = graphene.Schema(query=Query)
