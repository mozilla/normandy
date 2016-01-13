from django.http import HttpResponseRedirect

from normandy.bundler.models import Bundle
from normandy.bundler.views import BundlerView
from normandy.classifier.models import Client
from normandy.recipes.models import Recipe
from normandy.counters import get_counter


def classify(request):
    """
    Determine the recipe bundle that matches the requesting client and
    redirect to the bundler URL for it.
    """
    client = Client(request)
    counter = get_counter()

    enabled = Recipe.objects.filter(enabled=True)
    matched = [r for r in enabled if r.matches(client)]
    for r in matched:
        counter.increment(r)
    bundle = Bundle(matched)

    return HttpResponseRedirect(BundlerView.url_for(bundle))
