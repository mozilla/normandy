from django.shortcuts import render

from normandy.classifier.models import Bundle, Client


def repair(request, locale):
    """
    Fetch a bundle of recipes for the self-repair endpoint and return an
    HTML page that executes them.
    """
    client = Client(request, locale=locale)
    bundle = Bundle.for_client(client)
    return render(request, 'selfrepair/repair.html', {
        'bundle': bundle,
    })
