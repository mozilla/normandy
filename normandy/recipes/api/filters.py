import django_filters


class EnabledStateFilter(django_filters.Filter):
    # A special case filter for filtering recipes by their enabled state

    def filter(self, qs, value):
        if value is not None:
            lc_value = value.lower()
            if lc_value in ["true", "1"]:
                return qs.only_enabled()
            elif lc_value in ["false", "0"]:
                return qs.only_disabled()
        return qs


class CharSplitFilter(django_filters.CharFilter):
    """Custom CharFilter class that splits the value (if it's set) by `,` into a list
    and uses the `__in` operator."""

    def filter(self, qs, value):
        if value:
            qs = qs.filter(**{"{}__in".format(self.field_name): value.split(",")})
        return qs
