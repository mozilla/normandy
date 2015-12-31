from django.core.urlresolvers import reverse
from django.http import HttpResponse, HttpResponseBadRequest
from django.views.generic import View

from normandy.base.utils import urlparams
from normandy.recipes.models import Recipe


class BundlerView(View):
    def get(self, request):
        """
        Join the requested recipes together and return them to the
        client.
        """
        try:
            recipe_ids = [int(recipe_id) for recipe_id in request.GET.getlist('ids')]
        except ValueError:
            return HttpResponseBadRequest('Malformed "ids" parameter.')

        recipes = Recipe.objects.filter(enabled=True, id__in=recipe_ids).order_by('filename')
        return HttpResponse(
            ''.join(recipe.content for recipe in recipes),
            content_type='application/javascript',
        )

    @classmethod
    def url_for(cls, bundle):
        """Generate the bundler URL for the given bundle."""
        return urlparams(reverse('normandy.bundler'), hash=bundle.hash, ids=bundle.ids)
