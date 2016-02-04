from django.conf.urls import url, include

from rest_framework.routers import DefaultRouter

from normandy.recipes.api.views import ActionViewSet

# API Router
router = DefaultRouter()
router.register(r'action', ActionViewSet)


urlpatterns = [
    url(r'^api/v1/', include(router.urls)),
]
