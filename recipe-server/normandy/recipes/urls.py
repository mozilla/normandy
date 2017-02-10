from django.conf.urls import url, include

from normandy.base.api.routers import RouterWithDetachedViews
from normandy.recipes.api.views import (
    ActionImplementationView,
    ActionViewSet,
    ClassifyClient,
    Filters,
    RecipeViewSet,
    RecipeRevisionViewSet,
)


# API Router
router = RouterWithDetachedViews()
router.register('action', ActionViewSet)
router.register('recipe', RecipeViewSet)
router.register('recipe_revision', RecipeRevisionViewSet)

router.register_view('classify_client', ClassifyClient, name='classify-client')
router.register_view('filters', Filters)

app_name = 'recipes'

urlpatterns = [
    url(r'^api/v1/', include(router.urls)),
    url(
        r'^api/v1/action/(?P<name>[_\-\w]+)/implementation/(?P<impl_hash>[0-9a-f]{40})/$',
        ActionImplementationView.as_view(),
        name='action-implementation'
    ),
]
