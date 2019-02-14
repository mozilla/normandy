from django.conf.urls import url, include

from normandy.base.api.routers import MixedViewRouter
from normandy.studies.api.v1 import views as v1_views
from normandy.studies.api.v2 import views as v2_views
from normandy.studies.api.v3 import views as v3_views


# API Router
v1_router = MixedViewRouter()
v1_router.register("extension", v1_views.ExtensionViewSet)

v2_router = MixedViewRouter()
v2_router.register("extension", v2_views.ExtensionViewSet)

v3_router = MixedViewRouter()
v3_router.register("extension", v3_views.ExtensionViewSet)

app_name = "studies"

urlpatterns = [
    url(r"^api/v1/", include((v1_router.urls, "studies"), namespace="v1")),
    url(r"^api/v2/", include((v2_router.urls, "studies"), namespace="v2")),
    url(r"^api/v3/", include((v3_router.urls, "studies"), namespace="v3")),
]
