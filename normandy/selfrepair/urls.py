from django.conf.urls import url

from normandy.selfrepair import views

app_name = 'selfrepair'

urlpatterns = [
    url(r'^(?P<locale>[A-Za-z\-]+)/repair/$', views.repair, name='index'),
]
