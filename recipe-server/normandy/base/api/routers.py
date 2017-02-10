from django.conf.urls import url

from rest_framework.routers import DefaultRouter

from normandy.base.api.views import APIRootView


class RouterWithDetachedViews(DefaultRouter):
    """Router that allows for detached routes."""

    def __init__(self, *args, view=APIRootView, **kwargs):
        super().__init__(*args, **kwargs)
        self.view = view
        self.registered_view_urls = []

    def get_urls(self):
        """
        Generate the list of URL patterns, including a default root view for the API.
        """
        # Get the superclass of DefaultRouter, skipping over DefaultRouter
        urls = super(DefaultRouter, self).get_urls()
        urls.extend(self.registered_view_urls)

        view = self.get_api_root_view(api_urls=urls[:])
        root_url = url(r'^$', view, name=self.root_view_name)
        urls.append(root_url)

        return urls

    def register_view(self, prefix, View, **kwargs):
        self.registered_view_urls.append(url(r'^{}/$'.format(prefix), View.as_view(), **kwargs))

    def get_api_root_view(self, api_urls):
        return self.view.as_view(api_urls=api_urls)
