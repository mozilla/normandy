from django.conf import settings
from django.shortcuts import render
from django.views.decorators.cache import cache_control

from normandy.base.decorators import short_circuit_middlewares


@short_circuit_middlewares
@cache_control(public=True, max_age=settings.API_CACHE_TIME)
def repair(request, locale):
    return render(request, 'selfrepair/repair.html', {
        'locale': locale,
    })
