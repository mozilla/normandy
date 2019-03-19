from django.conf.urls import url, include

from normandy.base.api.routers import MixedViewRouter
from normandy.studies.api.v3 import views as v3_views


# API Router
v3_router = MixedViewRouter()
v3_router.register("extension", v3_views.ExtensionViewSet)

app_name = "studies"

urlpatterns = [url(r"^api/v3/", include((v3_router.urls, "studies"), namespace="v3"))]
