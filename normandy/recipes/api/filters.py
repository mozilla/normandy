import django_filters

from normandy.recipes.models import Recipe


class EnabledStateFilter(django_filters.Filter):
    """A special case filter for filtering recipes by their enabled state"""

    def filter(self, qs, value):
        if value is not None:
            lc_value = value.lower()
            if lc_value in ["true", "1"]:
                return qs.only_enabled()
            elif lc_value in ["false", "0"]:
                return qs.only_disabled()
        return qs


class BaselineCapabilitiesFilter(django_filters.Filter):
    """Filters recipe by whether they use only baseline capabilities, defaulting to only baseline."""

    def __init__(self, *args, default_only_baseline=False, **kwargs):
        super().__init__(*args, **kwargs)
        self.default_only_baseline = default_only_baseline

    def filter(self, qs, value):
        baseline_only = self.default_only_baseline

        if value is not None:
            lc_value = value.lower()
            baseline_only = lc_value in ["true", "1"]

        if baseline_only:
            recipes = list(qs)
            if not all(isinstance(recipe, Recipe) for recipe in recipes):
                raise TypeError("BaselineCapabilitiesFilter can only be used to filter recipes")
            match_ids = []
            for recipe in recipes:
                if (
                    recipe.approved_revision
                    and recipe.approved_revision.uses_only_baseline_capabilities()
                ):
                    match_ids.append(recipe.id)
            return Recipe.objects.filter(id__in=match_ids)

        return qs


class CharSplitFilter(django_filters.CharFilter):
    """Custom CharFilter class that splits the value (if it's set) by `,` into a list
    and uses the `__in` operator."""

    def filter(self, qs, value):
        if value:
            qs = qs.filter(**{"{}__in".format(self.field_name): value.split(",")})
        return qs


class FilterObjectFieldFilter(django_filters.Filter):
    """
    Find recipes that have a filter object with the given field

    Format for the filter's value is `key1:value1,key2:value2`. This would
    include recipes that have a filter object that has a field `key1` that
    contains the value `value1`, and that have a filter object with a field
    `key2` that contains `value2`. The two filter objects do not have to be
    the same, but may be.
    """

    def filter(self, qs, value):
        if value is None:
            return qs

        needles = {k: v for k, v in [p.split(":") for p in value.split(",")]}

        # Let the database do a first pass filter
        for k, v in needles.items():
            qs = qs.filter(latest_revision__filter_object_json__contains=k)
            qs = qs.filter(latest_revision__filter_object_json__contains=v)

        recipes = list(qs)
        if not all(isinstance(recipe, Recipe) for recipe in recipes):
            raise TypeError("FilterObjectFieldFilter can only be used to filter recipes")

        # For every recipe that contains the right substrings, look through
        # their filter objects for an actual match
        match_ids = []
        for recipe in recipes:
            recipe_matches = True

            # Recipes needs to have all the keys and values in the needles
            for k, v in needles.items():
                for filter_object in recipe.latest_revision.filter_object:
                    # Don't consider invalid filter objects
                    if not filter_object.is_valid():
                        continue
                    if k in filter_object.data and v in str(filter_object.data[k]):
                        # Found a match
                        break
                else:
                    # Did not break, so no match was not found
                    recipe_matches = False
                    break

            if recipe_matches:
                match_ids.append(recipe.id)

        return Recipe.objects.filter(id__in=match_ids)
