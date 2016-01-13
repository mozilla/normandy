class CounterBackend:
    """Base class for counter backends."""

    def increment(name):
        """
        Increment the counter named `name`.

        If no such counter exists, it will be created with a value of 1.
        """
        raise NotImplemented

    def get(name):
        """
        Retrieve the value of the counter named `name`.

        If no such counter exists, returns 0.
        """
        raise NotImplemented


class InMemoryCounterBackend(CounterBackend):

    def __init__(self):
        self.counts = {}

    def increment(self, name):
        val = self.counts.get(name, 0)
        self.counts[name] = val + 1

    def get(self, name):
        val = self.counts.get(name, 0)
        return val


# TODO: This should probably be a setting.
_counter_backend = InMemoryCounterBackend

class Counter:

    def __init__(self):
        self.backend = _counter_backend()

    def _recipe_name(self, recipe):
        return 'recipe-{}'.format(recipe.pk)

    def check(self, recipe):
        if not recipe.has_counter:
            return True

        name = self._recipe_name(recipe)
        count = self.backend.get(name)
        return count < recipe.count_limit

    def increment(self, recipe):
        if not recipe.has_counter:
            return True

        name = self._recipe_name(recipe)
        self.backend.increment(name)


_counter = None

def get_counter():
    global _counter
    if _counter is None:
        _counter = Counter()
    return _counter
