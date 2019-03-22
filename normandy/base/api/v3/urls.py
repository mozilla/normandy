from django.conf.urls import include, url

from normandy.base.api.routers import MixedViewRouter
from normandy.base.api.v3 import views


# API Router
router = MixedViewRouter()
router.register("user", views.UserViewSet)
router.register("group", views.GroupViewSet)


app_name = "base"

urlpatterns = [
    url(r"^service_info/", views.ServiceInfoView.as_view(), name="service-info"),
    url(r"", include(router.urls)),
]
