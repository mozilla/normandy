from django.shortcuts import render


def repair(request, locale):
    return render(request, 'selfrepair/repair.html', {
        'locale': locale,
    })
