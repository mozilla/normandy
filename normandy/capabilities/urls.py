from django.conf.urls import include, url


app_name = "capabilities"

urlpatterns = [url(r"^api/v3/", include("normandy.capabilities.api.v3.urls", namespace="v3"))]
