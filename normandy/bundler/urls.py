from django.conf.urls import url

from normandy.bundler import views


urlpatterns = [
    url(r'^bundle/$', views.BundlerView.as_view(), name='normandy.bundler'),
]
