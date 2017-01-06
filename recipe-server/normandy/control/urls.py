from django.conf import settings
from django.conf.urls import url, include
from django.contrib.auth.views import login, logout_then_login
from django.core.urlresolvers import reverse_lazy

from normandy.control import views


app_name = 'control'
urlpatterns = []


if settings.ADMIN_ENABLED:
    urlpatterns += [
        url(r'^control/', include([
            url(
                'login',
                login,
                {'template_name': 'control/admin/login.html'},
                name='login'
            ),
            url(
                'logout',
                logout_then_login,
                {'login_url': reverse_lazy('control:login')},
                name='logout'
            ),
            url(r'^.*$', views.IndexView, name='index'),
        ]))
    ]
