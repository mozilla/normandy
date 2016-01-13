import hashlib

from normandy.recipes.models import Recipe


class Bundle(object):
    """A bundle of recipes to be sent to the client."""
    def __init__(self, recipes=None):
        self.recipes = sorted(recipes, key=lambda r: r.name) or []

    @classmethod
    def for_client(cls, client):
        """Return a bundle of recipes matching the given HTTPRequest."""
        return cls(
            recipe for recipe in Recipe.objects.filter(enabled=True) if recipe.matches(client)
        )

    @property
    def ids(self):
        return [recipe.id for recipe in self.recipes]

    @property
    def hash(self):
        recipe_hashes = '_'.join([recipe.content_hash for recipe in self.recipes])
        return hashlib.sha1(recipe_hashes.encode('utf-8')).hexdigest()

    def __repr__(self):
        return '<Bundle ids={!r}>'.format(self.recipes)

    def __iter__(self):
        yield from self.recipes
