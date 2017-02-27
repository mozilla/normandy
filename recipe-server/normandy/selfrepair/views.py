from urllib.parse import urljoin

from django.conf import settings
from django.shortcuts import render
from django.views.decorators.cache import cache_control

from rest_framework.reverse import reverse

from normandy.base.decorators import short_circuit_middlewares


@short_circuit_middlewares
@cache_control(public=True, max_age=settings.API_CACHE_TIME)
def repair(request, locale):
    dynamic_base = settings.APP_SERVER_URL
    classify_client_url = urljoin(dynamic_base, reverse('recipes:classify-client'))

    return render(request, 'selfrepair/repair.html', {
        'locale': locale,
        'classify_client_url': classify_client_url,
    })
