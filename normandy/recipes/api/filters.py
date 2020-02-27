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
                if recipe.latest_revision.uses_only_baseline_capabilities():
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
