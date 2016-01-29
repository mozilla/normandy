from django.conf.urls import url, include

from rest_framework.routers import DefaultRouter

from normandy.recipes.api import ActionViewSet

# API Router
router = DefaultRouter()
router.register(r'actions', ActionViewSet)


urlpatterns = [
    url(r'^api/v1/', include(router.urls)),
]
