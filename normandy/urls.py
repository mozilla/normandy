from django.conf import settings
from django.conf.urls import include, url
from django.conf.urls.static import static
from django.contrib import admin


urlpatterns = []

if settings.ADMIN_ENABLED:
    urlpatterns += [url(r'^admin/', admin.site.urls)]

urlpatterns += [
    url(r'', include('normandy.base.urls')),
    url(r'', include('normandy.recipes.urls')),
    url(r'', include('normandy.selfrepair.urls')),
    url(r'', include('normandy.control.urls')),
    url(r'', include('normandy.health.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
