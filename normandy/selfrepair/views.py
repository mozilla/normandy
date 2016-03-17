from django.shortcuts import render

from normandy.base.decorators import short_circuit_middlewares


@short_circuit_middlewares
def repair(request, locale):
    return render(request, 'selfrepair/repair.html', {
        'locale': locale,
    })
