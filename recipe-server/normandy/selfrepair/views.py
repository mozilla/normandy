from urllib.parse import urljoin

from django.conf import settings
from django.shortcuts import render

from rest_framework.reverse import reverse

from normandy.base.decorators import api_cache_control, short_circuit_middlewares


@short_circuit_middlewares
@api_cache_control()
def repair(request, locale):
    dynamic_base = settings.APP_SERVER_URL
    classify_client_url = urljoin(dynamic_base, reverse('recipes:classify-client'))

    return render(request, 'selfrepair/repair.html', {
        'locale': locale,
        'classify_client_url': classify_client_url,
    })
