import django_filters


class CaseInsensitiveBooleanFilter(django_filters.Filter):
    # The default django_filters boolean filter *only* accepts True and False
    # which is problematic when dealing with non-Python clients. This allows
    # the lower case variants, as well as 0 and 1.

    def filter(self, qs, value):
        if value is not None:
            lc_value = value.lower()
            if lc_value in ['true', '1']:
                value = True
            if lc_value in ['false', '0']:
                value = False
            return qs.filter(**{self.name: value})
        return qs
