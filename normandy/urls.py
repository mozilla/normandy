from django.conf import settings
from django.conf.urls import include, url
from django.conf.urls.static import static
from django.contrib import admin
from rest_framework_swagger.views import get_swagger_view

from normandy.base.api import views as base_api_views
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

if settings.ADMIN_ENABLED:
    urlpatterns += [url(r"^admin/", admin.site.urls)]

urlpatterns += [
    url(r"", include("normandy.base.urls")),
    url(r"", include("normandy.recipes.urls")),
    url(r"", include("normandy.selfrepair.urls")),
    url(r"", include("normandy.health.urls")),
    url(r"", include("normandy.studies.urls")),
    url(r"api/docs/", get_swagger_view()),
    # v1 API
    url(r"^api/v1/", include((v1_router.urls, "normandy"), namespace="v1")),
    url(
        r"^api/v1/action/(?P<name>[_\-\w]+)/implementation/(?P<impl_hash>[a-zA-Z0-9_-]*)/$",
        recipes_api_v1_views.ActionImplementationView.as_view(),
        name="action-implementation",
    ),
    url(r"^api/v1/user/me/", base_api_views.CurrentUserView.as_view(), name="current-user"),
]

# static handles serving uploaded files during development; it disables
# itself if settings.DEBUG is false.
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

# this has a catch-all at the root so it must always be last
urlpatterns += [url(r"", include("normandy.control.urls"))]
