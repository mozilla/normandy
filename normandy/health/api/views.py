import os

from django.conf import settings
from django.core.checks.registry import registry as checks_registry
from django.core.checks import messages as checks_messages

from rest_framework import status
from rest_framework.decorators import api_view, authentication_classes
from rest_framework.response import Response
from statsd.defaults.django import statsd

from normandy.base.decorators import short_circuit_middlewares


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


@api_view(['GET'])
def lbheartbeat(request):
    # lets the load balancer know the application is running and available
    # must return 200 (not 204) for ELB
    # http://docs.aws.amazon.com/ElasticLoadBalancing/latest/DeveloperGuide/elb-healthchecks.html
    return Response('', status=status.HTTP_200_OK)


@short_circuit_middlewares
@api_view(['GET'])
@authentication_classes([])
def heartbeat(request):
    all_checks = checks_registry.get_checks(include_deployment_checks=not settings.DEBUG)

    details = {}
    statuses = {}
    level = 0

    for check in all_checks:
        detail = heartbeat_check_detail(check)
        statuses[check.__name__] = detail['status']
        level = max(level, detail['level'])
        if detail['level'] > 0:
            details[check.__name__] = detail

    if level < checks_messages.WARNING:
        res_status = status.HTTP_200_OK
        statsd.incr('heartbeat.pass')
    else:
        res_status = status.HTTP_500_INTERNAL_SERVER_ERROR
        statsd.incr('heartbeat.fail')

    return Response({
        'status': heartbeat_level_to_text(level),
        'checks': statuses,
        'details': details,
    }, status=res_status)


def heartbeat_level_to_text(level):
    statuses = {
        0: 'ok',
        checks_messages.DEBUG: 'debug',
        checks_messages.INFO: 'info',
        checks_messages.WARNING: 'warning',
        checks_messages.ERROR: 'error',
        checks_messages.CRITICAL: 'critical',
    }
    return statuses.get(level, 'unknown')


def heartbeat_check_detail(check):
    errors = check(app_configs=None)
    level = 0
    level = max([level] + [e.level for e in errors])

    return {
        'status': heartbeat_level_to_text(level),
        'level': level,
        'messages': [e.msg for e in errors],
    }
