from django.http import HttpResponseRedirect

from normandy.bundler.models import Bundle
from normandy.bundler.views import BundlerView
from normandy.classifier.models import Client
from normandy.counters import get_counter


def classify(request):
    """
    Determine the recipe bundle that matches the requesting client and
    redirect to the bundler URL for it.
    """
    client = Client(request)
    bundle = Bundle.for_client(client)

    counter = get_counter()
    for r in bundle:
        counter.increment(r)

    return HttpResponseRedirect(BundlerView.url_for(bundle))
