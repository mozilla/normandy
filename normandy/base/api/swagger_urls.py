from django.conf.urls import url

from drf_yasg.views import get_schema_view
from drf_yasg import openapi
from rest_framework import permissions


app_name = "base"

schema_view = get_schema_view(
    openapi.Info(
        title="Normandy API",
        default_version="v1",
        description="An API to interact with the Normandy Recipe Server",
        contact=openapi.Contact(email="product-delivery@mozilla.com"),
        license=openapi.License(name="MPL-2.0"),
    ),
    public=True,
    permission_classes=(permissions.AllowAny,),
)

urlpatterns = [
    url(
        r"^swagger(?P<format>\.json|\.yaml)$",
        schema_view.without_ui(cache_timeout=0),
        name="schema-json",
    ),
    url(r"^swagger/$", schema_view.with_ui("swagger", cache_timeout=0), name="schema-swagger-ui"),
]
