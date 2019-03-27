from django.conf.urls import url, include


app_name = "studies"

urlpatterns = [
    url(r"^api/v1/", include("normandy.studies.api.v1.urls", namespace="v1")),
    url(r"^api/v3/", include("normandy.studies.api.v3.urls", namespace="v3")),
]
