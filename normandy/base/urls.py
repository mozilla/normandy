from django.conf.urls import include, url

from normandy.base import views
from normandy.base.api import views as api_views
from normandy.base.api.routers import MixedViewRouter


# API Router
router = MixedViewRouter()
router.register("user", api_views.UserViewSet)
router.register("group", api_views.GroupViewSet)


urlpatterns = [
    url(r"^$", views.index, name="index"),
    url(r"^favicon.ico", views.favicon),
    url(r"^api/v2/service_info/", api_views.ServiceInfoView.as_view(), name="service-info-v2"),
    url(r"^api/v3/service_info/", api_views.ServiceInfoView.as_view(), name="service-info"),
    url(r"^api/v1/user/me/", api_views.CurrentUserView.as_view(), name="current-user"),
    url(r"^api/v3/", include(router.urls)),
]
