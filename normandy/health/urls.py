from django.conf.urls import url

from normandy.health.api import views

urlpatterns = [
    url(r'^__version__', views.version, name='normandy.version'),
    url(r'^__heartbeat__', views.heartbeat, name='normandy.heartbeat'),
]
