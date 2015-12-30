from django.http import HttpResponseRedirect

from normandy.bundler.models import Bundle
from normandy.bundler.views import BundlerView
from normandy.classifier.models import Client
from normandy.recipes.models import Recipe


def classify(request):
    """
    Determine the recipe bundle that matches the requesting client and
    redirect to the bundler URL for it.
    """
    client = Client(request)
    bundle = Bundle(
        recipe for recipe in Recipe.objects.filter(enabled=True) if recipe.matches(client)
    )

    return HttpResponseRedirect(BundlerView.url_for(bundle))
