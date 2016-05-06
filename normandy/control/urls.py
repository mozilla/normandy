from django.conf import settings
from django.conf.urls import url, include

from normandy.control import views as control_views
from django.contrib.auth.views import login, logout_then_login

app_name = 'control'
urlpatterns = []

if settings.ADMIN_ENABLED:
    urlpatterns += [
        url(r'^control/', include([
            url(r'^$', control_views.IndexView.as_view(), name='index'),
            url(r'^recipe/new/$', control_views.CreateView.as_view(), name='new_recipe'),
            url(r'^recipe/(?P<pk>[0-9]+)/$', control_views.EditView.as_view(), name='edit_recipe'),
            url(r'^recipe/(?P<pk>[0-9]+)/delete/$', control_views.DeleteView.as_view(),
                name='delete_recipe'),
            url('login', login, {'template_name': 'control/admin/login.html'}, name='login'),
            url('logout', logout_then_login, {'login_url': '/control/login.html'}, name='logout'),
        ]))
    ]
