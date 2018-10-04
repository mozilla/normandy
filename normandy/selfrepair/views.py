from django.shortcuts import render
from django.views.decorators.cache import cache_control


ONE_WEEK_IN_SECONDS = 60 * 60 * 24 * 7


@cache_control(public=True, max_age=ONE_WEEK_IN_SECONDS)
def repair(request, locale):
    return render(request, "selfrepair/repair.html")
