from django.conf import settings
from django.conf.urls import include, url
from django.conf.urls.static import static

from normandy.base.api.routers import MixedViewRouter
from normandy.recipes.api.v1 import views as recipes_api_v1_views
from normandy.studies.api.v1 import views as studies_api_v1_views


# API Router
v1_router = MixedViewRouter()
v1_router.register("action", recipes_api_v1_views.ActionViewSet)
v1_router.register("recipe", recipes_api_v1_views.RecipeViewSet)
v1_router.register("recipe_revision", recipes_api_v1_views.RecipeRevisionViewSet)
v1_router.register(r"approval_request", recipes_api_v1_views.ApprovalRequestViewSet)
v1_router.register_view(
    "classify_client", recipes_api_v1_views.ClassifyClient, name="classify-client", allow_cdn=False
)

v1_router.register("extension", studies_api_v1_views.ExtensionViewSet)

urlpatterns = []

urlpatterns += [
    url(r"", include("normandy.recipes.urls")),
    url(r"", include("normandy.selfrepair.urls")),
    url(r"", include("normandy.health.urls")),
    url(r"", include("normandy.studies.urls")),
    # v1 API
    url(r"^api/v1/", include((v1_router.urls, "normandy"), namespace="v1")),
    # Swagger
    url(r"^api/v1/", include("normandy.base.api.swagger_urls", namespace="v1")),
    url(r"^api/v3/", include("normandy.base.api.swagger_urls", namespace="v3")),
    url(
        r"^api/v1/action/(?P<name>[_\-\w]+)/implementation/(?P<impl_hash>[a-zA-Z0-9_-]*)/$",
        recipes_api_v1_views.ActionImplementationView.as_view(),
        name="action-implementation",
    ),
]

# static handles serving uploaded files during development; it disables
# itself if settings.DEBUG is false.
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

# this has a catch-all at the root so it must always be last
urlpatterns += [url(r"", include("normandy.base.urls"))]
