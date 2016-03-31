from django.conf.urls import url

from normandy.control import views as control_views

urlpatterns = [
    url(r'^$', control_views.IndexView.as_view(), name='index'),
    url(r'^recipe/(?P<pk>[0-9]+)/edit/$', control_views.EditView.as_view(), name='edit_recipe'),
]

