from django.conf import settings
from django.conf.urls import include, url
from django.conf.urls.static import static
from django.contrib import admin
from rest_framework_swagger.views import get_swagger_view


urlpatterns = []

if settings.ADMIN_ENABLED:
    urlpatterns += [url(r'^admin/', admin.site.urls)]

urlpatterns += [
    url(r'', include('normandy.base.urls')),
    url(r'', include('normandy.recipes.urls')),
    url(r'', include('normandy.selfrepair.urls')),
    url(r'', include('normandy.control.urls')),
    url(r'', include('normandy.health.urls')),
    url(r'', include('normandy.studies.urls')),
    url(r'api/docs/', get_swagger_view())
]

# static handles serving uploaded files during development; it disables
# itself if settings.DEBUG is false.
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
