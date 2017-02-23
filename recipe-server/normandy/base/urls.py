from django.conf.urls import include, url

from rest_framework.routers import DefaultRouter

from normandy.base import views
from normandy.base.api import views as api_views


# API Router
router = DefaultRouter()
router.register(r'user', api_views.UserViewSet)


urlpatterns = [
    url(r'^api/v1/', include(router.urls)),
    url(r'^$', views.index, name='index'),
]
