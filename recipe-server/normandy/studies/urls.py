from django.conf.urls import url, include

from rest_framework import routers

from normandy.studies.api import ExtensionViewSet


# API Router
router = routers.SimpleRouter()
router.register('extension', ExtensionViewSet)

app_name = 'studies'

urlpatterns = [
    url(r'^api/v1/', include(router.urls)),
]
