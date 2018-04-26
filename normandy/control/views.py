from django.conf import settings
from django.shortcuts import render, redirect


def index(request):
    if not request.user.is_authenticated():
        return redirect('%s?next=%s' % ('/login/', request.path))
    else:
        return render(request, 'control/index.html', {
            'PEER_APPROVAL_ENFORCED': settings.PEER_APPROVAL_ENFORCED,
        })
