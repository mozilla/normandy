from django.conf.urls import url, include

from rest_framework.routers import DefaultRouter

from normandy.recipes.api.views import (
    ActionImplementationView,
    ActionViewSet,
    ClassifyClient,
    Filters,
    RecipeViewSet,
    RecipeRevisionViewSet,
)

# API Router
router = DefaultRouter()
router.register(r'action', ActionViewSet)
router.register(r'recipe', RecipeViewSet)
router.register(r'recipe_revision', RecipeRevisionViewSet)


app_name = 'recipes'

urlpatterns = [
    url(r'^api/v1/', include(router.urls)),
    url(
        r'^api/v1/action/(?P<name>[_\-\w]+)/implementation/(?P<impl_hash>[0-9a-f]{40})/$',
        ActionImplementationView.as_view(),
        name='action-implementation'
    ),
    url(r'^api/v1/classify_client/$', ClassifyClient.as_view(), name='classify-client'),
    url(r'^api/v1/filters/$', Filters.as_view(), name='filters'),
]
