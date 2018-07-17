import django_filters
from rest_framework import filters


class CaseInsensitiveBooleanFilter(django_filters.Filter):
    # The default django_filters boolean filter *only* accepts True and False
    # which is problematic when dealing with non-Python clients. This allows
    # the lower case variants, as well as 0 and 1.

    def filter(self, qs, value):
        if value is not None:
            lc_value = value.lower()
            if lc_value in ["true", "1"]:
                value = True
            elif lc_value in ["false", "0"]:
                value = False
            return qs.filter(**{self.field_name: value})
        return qs


class AliasedOrderingFilter(filters.OrderingFilter):
    aliases = {}

    def get_valid_fields(self, *args, **kwargs):
        valid_fields = super().get_valid_fields(*args, **kwargs)
        return valid_fields + list(self.aliases.values())

    def get_ordering(self, *args, **kwargs):
        ordering = super().get_ordering(*args, **kwargs)
        if ordering is not None:
            return list(map(self.replace_alias, ordering))
        return ordering

    def replace_alias(self, term):
        field = term.lstrip("-")
        if field in self.aliases:
            modifier = "-" if term.startswith("-") else ""
            return modifier + self.aliases[field][0]
        return term
