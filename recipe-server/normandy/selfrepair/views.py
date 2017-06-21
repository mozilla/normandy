from django.shortcuts import render

from normandy.base.decorators import api_cache_control, short_circuit_middlewares


@short_circuit_middlewares
@api_cache_control()
def repair(request, locale):
    return render(request, 'selfrepair/repair.html')
