import os

from django.conf import settings

from rest_framework.decorators import api_view
from rest_framework.response import Response


_commit = None


def get_commit():
    global _commit
    if _commit is None:
        path = os.path.join(settings.BASE_DIR, '__version__', 'commit')
        try:
            with open(path) as f:
                _commit = f.read().strip()
        except OSError:
            _commit = 'unknown'

    return _commit


@api_view(['GET'])
def version(request):
    return Response({
        'source': 'https://github.com/mozilla/normandy',
        'commit': get_commit(),
    })
