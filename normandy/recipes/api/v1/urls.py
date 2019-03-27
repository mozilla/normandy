from django.conf.urls import include, url

from normandy.base.api.routers import MixedViewRouter
from normandy.recipes.api.v1 import views


app_name = "recipes"

# API Router
router = MixedViewRouter()
router.register("action", views.ActionViewSet)
router.register("recipe", views.RecipeViewSet)
router.register("recipe_revision", views.RecipeRevisionViewSet)
router.register("approval_request", views.ApprovalRequestViewSet)
router.register_view(
    "classify_client", views.ClassifyClient, name="classify-client", allow_cdn=False
)

urlpatterns = [
    url(
        r"^action/(?P<name>[_\-\w]+)/implementation/(?P<impl_hash>[a-zA-Z0-9_-]*)/$",
        views.ActionImplementationView.as_view(),
        name="action-implementation",
    ),
    url(r"", include(router.urls)),
]
