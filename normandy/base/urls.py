from django.conf.urls import include, url

from normandy.base import views


app_name = "base"

urlpatterns = [
    url(r"^$", views.index, name="index"),
    url(r"^favicon.ico", views.favicon),
    url(r"^api/v1/", include("normandy.base.api.v1.urls", namespace="v1")),
    url(r"^api/v3/", include("normandy.base.api.v3.urls", namespace="v3")),
    # catch-all must be last
    url(r"^.*/$", views.index),
]
