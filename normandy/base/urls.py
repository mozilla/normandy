from django.conf import settings
from django.conf.urls import url

from normandy.base import views
from normandy.base.api.views import TokenView

urlpatterns = [
    url(r'^$', views.index, name='index'),
]

if settings.ADMIN_ENABLED:
    urlpatterns.append(url(r'^api/v1/token/', TokenView.as_view(), name='token-implementation'))
