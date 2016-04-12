from django.conf.urls import url

from normandy.classifier import api

app_name = 'classifier'

urlpatterns = [
    url(r'^api/v1/fetch_bundle/$', api.FetchBundle.as_view(), name='api.v1.fetch_bundle'),
]
