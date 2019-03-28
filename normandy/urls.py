from django.conf import settings
from django.conf.urls import include, url
from django.conf.urls.static import static
from django.views.decorators.csrf import csrf_exempt

from graphene_django.views import GraphQLView


app_name = "normandy"

urlpatterns = []

urlpatterns += [
    url(r"", include("normandy.recipes.urls")),
    url(r"", include("normandy.selfrepair.urls")),
    url(r"", include("normandy.health.urls")),
    url(r"", include("normandy.studies.urls")),
    # Swagger
    url(r"^api/v1/", include("normandy.base.api.swagger_urls", namespace="v1")),
    url(r"^api/v3/", include("normandy.base.api.swagger_urls", namespace="v3")),
    url(r"^api/graphql/", csrf_exempt(GraphQLView.as_view())),
]

# static handles serving uploaded files during development; it disables
# itself if settings.DEBUG is false.
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

# this has a catch-all at the root so it must always be last
urlpatterns += [url(r"", include("normandy.base.urls"))]
