from django.http import HttpResponseRedirect

from normandy.bundler.models import Bundle
from normandy.bundler.views import BundlerView
from normandy.classifier.models import Client


def classify(request):
    """
    Determine the recipe bundle that matches the requesting client and
    redirect to the bundler URL for it.
    """
    client = Client(request)
    bundle = Bundle.for_client(client)

    return HttpResponseRedirect(BundlerView.url_for(bundle))
