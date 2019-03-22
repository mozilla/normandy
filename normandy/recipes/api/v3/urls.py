from django.conf.urls import url, include

from normandy.base.api.routers import MixedViewRouter
from normandy.recipes.api.v3 import views


app_name = "recipes"

# API Router
router = MixedViewRouter()
router.register("action", views.ActionViewSet)
router.register("recipe", views.RecipeViewSet)
router.register("recipe_revision", views.RecipeRevisionViewSet)
router.register("approval_request", views.ApprovalRequestViewSet)
router.register_view("filters", views.Filters, name="filters")

urlpatterns = [
    url(r"", include(router.urls)),
    url(
        r"^identicon/(?P<generation>v[0-9]):(?P<seed>.{1,64})\.svg",
        views.IdenticonView.as_view(),
        name="identicon",
    ),
]
