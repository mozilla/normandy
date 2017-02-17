from django.conf.urls import url

from rest_framework.routers import SimpleRouter

from normandy.base.api.views import APIRootView


class MixedViewRouter(SimpleRouter):
    """Router that allows for detached routes."""

    root_view_name = 'api-root'

    def __init__(self, *args, view=APIRootView, **kwargs):
        super().__init__(*args, **kwargs)
        self.api_root_view = view
        self.registered_view_urls = []

    def get_urls(self):
        """
        Generate the list of URL patterns, including a default root view for the API.
        """
        urls = super().get_urls()
        urls.extend(self.registered_view_urls)

        view = self.get_api_root_view(api_urls=urls[:])
        root_url = url(r'^$', view, name=self.root_view_name)
        urls.append(root_url)

        return urls

    def register(self, prefix, viewset, base_name=None, allow_cdn=True):
        if not allow_cdn:
            raise NotImplementedError("Can't pass allow_cdn=False for viewsets")
        super().register(prefix, viewset, base_name=base_name)

    def register_view(self, prefix, View, *, name, allow_cdn=True, **kwargs):
        url_pattern = url(r'^{}/$'.format(prefix), View.as_view(), name=name, **kwargs)
        url_pattern.allow_cdn = allow_cdn
        self.registered_view_urls.append(url_pattern)

    def get_api_root_view(self, api_urls):
        return self.api_root_view.as_view(api_urls=api_urls)
