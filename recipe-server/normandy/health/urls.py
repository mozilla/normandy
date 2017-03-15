from django.conf.urls import url

from normandy.health.api import views

app_name = 'health'

urlpatterns = [
    url(r'^__version__', views.version, name='version'),
    url(r'^__heartbeat__', views.heartbeat, name='heartbeat'),
    url(r'^__lbheartbeat__', views.lbheartbeat, name='lbheartbeat'),
    url(r'^__cspreport__', views.cspreport, name='cspreport'),
]
