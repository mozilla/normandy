from django.conf.urls import url

from normandy.selfrepair import views


urlpatterns = [
    url(r'^(?P<locale>[A-Za-z\-]+)/repair/$', views.repair, name='normandy.selfrepair'),
]
