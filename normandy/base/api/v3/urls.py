from django.conf.urls import include, url

from normandy.base.api.routers import MixedViewRouter
from normandy.base.api.v3 import views as api_views


# API Router
router = MixedViewRouter()
router.register("user", api_views.UserViewSet)
router.register("group", api_views.GroupViewSet)


app_name = "base"

urlpatterns = [
    url(r"^service_info/", api_views.ServiceInfoView.as_view(), name="service-info"),
    url(r"", include(router.urls)),
]
