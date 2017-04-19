from django.conf.urls import url, include

from normandy.base.api.routers import MixedViewRouter
from normandy.recipes.api.v1.views import (
    ActionImplementationView,
    ActionViewSet,
    ApprovalRequestViewSet,
    ClassifyClient,
    Filters,
    RecipeViewSet,
    RecipeRevisionViewSet,
)


# API Router
router = MixedViewRouter()
router.register('action', ActionViewSet)
router.register('recipe', RecipeViewSet)
router.register('recipe_revision', RecipeRevisionViewSet)
router.register(r'approval_request', ApprovalRequestViewSet)

router.register_view('classify_client', ClassifyClient, name='classify-client', allow_cdn=False)
router.register_view('filters', Filters, name='filters')

app_name = 'recipes'

urlpatterns = [
    url(r'^api/v1/', include(router.urls)),
    url(
        r'^api/v1/action/(?P<name>[_\-\w]+)/implementation/(?P<impl_hash>[0-9a-f]{40})/$',
        ActionImplementationView.as_view(),
        name='action-implementation'
    ),
]
