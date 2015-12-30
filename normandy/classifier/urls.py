from django.conf.urls import url

from normandy.classifier import views


urlpatterns = [
    url(r'^classify/$', views.classify, name='normandy.classifier'),
]
