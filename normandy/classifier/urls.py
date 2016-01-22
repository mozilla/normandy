from django.conf.urls import url

from normandy.classifier import api, views


urlpatterns = [
    url(r'^classify/$', views.classify, name='normandy.classifier'),
    url(r'^api/v1/fetch_bundle/$', api.FetchBundle.as_view()),
]
