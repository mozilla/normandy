from django.http import HttpResponse, HttpResponseRedirect
from django.conf import settings
from django.contrib.staticfiles.templatetags.staticfiles import static

from normandy.control.views import index as control_index


def index(request):
    if settings.ADMIN_ENABLED:
        return control_index(request)
    return HttpResponse("<h1>Normandy</h1>")


def favicon(request):
    return HttpResponseRedirect(static("img/favicon.ico"))
