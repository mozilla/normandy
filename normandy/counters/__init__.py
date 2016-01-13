class CounterBackend(object):
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

    def reset(name):
        """
        Reset the value of a counter to 0.

        If no such counter exists, this is a no-op.
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

    def reset(self, name):
        if name in self.counts:
            self.counts[name] = 0


# TODO: This should probably be a setting.
_counter_backend = InMemoryCounterBackend

class Counter(object):

    def __init__(self):
        self.backend = _counter_backend()

    def _counter_key(self, recipe):
        return 'recipe-{}'.format(recipe.pk)

    def can_deliver(self, recipe):
        """
        Check a recipe against the counters.

        @returns True if the counter is not full, False if it is.
        """
        if not recipe.has_counter:
            return True

        name = self._recipe_name(recipe)
        count = self.backend.get(name)
        return count < recipe.count_limit

    def increment(self, recipe):
        """
        Increment the counter for a recipe.

        This is a no-op if the recipe doesn't need counters.
        """
        if not recipe.has_counter:
            return

        name = self._recipe_name(recipe)
        self.backend.increment(name)


_counter = None

def get_counter():
    global _counter
    if _counter is None:
        _counter = Counter()
    return _counter
