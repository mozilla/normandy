from django.conf.urls import url

from rest_framework.routers import SimpleRouter


class MixedViewRouter(SimpleRouter):
    """Router that allows for detached routes."""

    root_view_name = "api-root"

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.registered_view_urls = []

    def get_urls(self):
        """
        Generate the list of URL patterns for the API.
        """
        urls = super().get_urls()
        urls.extend(self.registered_view_urls)

        return urls

    def register(self, prefix, viewset, basename=None, allow_cdn=True):
        if not allow_cdn:
            raise NotImplementedError("Can't pass allow_cdn=False for viewsets")
        super().register(prefix, viewset, basename=basename)

    def register_view(self, prefix, View, *, name, allow_cdn=True, **kwargs):
        url_pattern = url(r"^{}/$".format(prefix), View.as_view(), name=name, **kwargs)
        url_pattern.allow_cdn = allow_cdn
        self.registered_view_urls.append(url_pattern)
