from django.conf.urls import url

from normandy.base.api.views import APIRootView


app_name = "base"

urlpatterns = [url(r"^$", APIRootView.as_view())]
