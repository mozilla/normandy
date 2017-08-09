from django.http import HttpResponse, HttpResponseRedirect


def index(request):
    return HttpResponse('<h1>Normandy</h1>')


def favicon(request):
    return HttpResponseRedirect('/static/img/favicon.ico')
