from django.conf.urls import url

from normandy.classifier import api


urlpatterns = [
    url(r'^api/v1/fetch_bundle/$', api.FetchBundle.as_view()),
]
