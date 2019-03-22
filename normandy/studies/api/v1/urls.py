from django.conf.urls import include, url

from normandy.base.api.routers import MixedViewRouter
from normandy.studies.api.v1 import views


# API Router
router = MixedViewRouter()
router.register("extension", views.ExtensionViewSet)


app_name = "studies"

urlpatterns = [url(r"", include(router.urls))]
