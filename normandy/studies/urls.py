from django.conf.urls import url, include

from rest_framework import routers

from normandy.studies.api.v2 import views as v2_views
from normandy.studies.api.v3 import views as v3_views


# API Router
v2_router = routers.SimpleRouter()
v2_router.register('extension', v2_views.ExtensionViewSet)

v3_router = routers.SimpleRouter()
v3_router.register('extension', v3_views.ExtensionViewSet)

app_name = 'studies'

urlpatterns = [
    url(r'^api/v2/', include(v2_router.urls)),
    url(r'^api/v3/', include(v3_router.urls)),
]
