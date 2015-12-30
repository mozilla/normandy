import hashlib


class Bundle(object):
    """A bundle of recipes to be sent to the client."""
    def __init__(self, recipes=None):
        self.recipes = sorted(recipes, key=lambda r: r.filename) or []

    @property
    def ids(self):
        return [recipe.id for recipe in self.recipes]

    @property
    def hash(self):
        recipe_hashes = '_'.join([recipe.content_hash for recipe in self.recipes])
        return hashlib.sha1(recipe_hashes.encode('utf-8')).hexdigest()
