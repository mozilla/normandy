from django.conf.urls import url, include

from normandy.base.api.routers import MixedViewRouter
from normandy.studies.api.v3 import views


# API Router
router = MixedViewRouter()
router.register("extension", views.ExtensionViewSet)


app_name = "studies"

urlpatterns = [url(r"", include(router.urls))]
