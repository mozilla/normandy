from django.conf.urls import url, include

from normandy.base.api.routers import MixedViewRouter
from normandy.recipes.api.v1 import views as api_v1_views
from normandy.recipes.api.v2 import views as api_v2_views


# API Router
v1_router = MixedViewRouter()
v1_router.register('action', api_v1_views.ActionViewSet)
v1_router.register('recipe', api_v1_views.RecipeViewSet)
v1_router.register('recipe_revision', api_v1_views.RecipeRevisionViewSet)
v1_router.register(r'approval_request', api_v1_views.ApprovalRequestViewSet)

v1_router.register_view('classify_client', api_v1_views.ClassifyClient, name='classify-client',
                        allow_cdn=False)
v1_router.register_view('filters', api_v1_views.Filters, name='filters')

v2_router = MixedViewRouter()
v2_router.register('action', api_v2_views.ActionViewSet)
v2_router.register('recipe', api_v2_views.RecipeViewSet)
v2_router.register('recipe_revision', api_v2_views.RecipeRevisionViewSet)
v2_router.register(r'approval_request', api_v2_views.ApprovalRequestViewSet)

app_name = 'recipes'

urlpatterns = [
    url(r'^api/v2/', include(v2_router.urls)),
    url(r'^api/v1/', include(v1_router.urls)),
    url(
        r'^api/v1/action/(?P<name>[_\-\w]+)/implementation/(?P<impl_hash>[^/]+)/$',
        api_v1_views.ActionImplementationView.as_view(),
        name='action-implementation'
    ),
]
