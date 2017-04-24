import json
import logging
import os
from functools import lru_cache
from datetime import datetime

from django.conf import settings
from django.core.checks.registry import registry as checks_registry
from django.core.checks import messages as checks_messages

from rest_framework import status
from rest_framework.decorators import api_view, authentication_classes
from rest_framework.response import Response
from statsd.defaults.django import statsd

from normandy.base.decorators import short_circuit_middlewares


logger = logging.getLogger(__name__)


@lru_cache(maxsize=1)
def get_version_info():

    def fetch_key(name):
        path = os.path.join(settings.BASE_DIR, '__version__', name)
        val = None
        try:
            with open(path) as f:
                val = f.read().strip()
        except OSError:
            pass
        return val or None

    try:
        build_time = datetime.utcfromtimestamp(int(fetch_key('build_time')))
    except (ValueError, TypeError) as e:
        build_time = None

    version_info = {
        'commit': fetch_key('commit'),
        'version': fetch_key('tag'),
        'build_time': build_time,
    }

    return version_info


@api_view(['GET'])
def version(request):
    repo_url = 'https://github.com/mozilla/normandy'
    version_info = get_version_info()

    commit = version_info['commit']
    version = version_info['version']
    build_time = version_info['build_time']

    return Response({
        'source': repo_url,
        'commit': commit,
        'commit_link': '{0}/commit/{1}'.format(repo_url, commit) if commit else None,
        'configuration': os.environ.get('DJANGO_CONFIGURATION'),
        'version': version,
        'build_time': build_time.isoformat(),
    })


@short_circuit_middlewares
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
    errors = list(filter(lambda e: e.id not in settings.SILENCED_SYSTEM_CHECKS, errors))
    level = max([0] + [e.level for e in errors])

    return {
        'status': heartbeat_level_to_text(level),
        'level': level,
        'messages': {e.id: e.msg for e in errors},
    }


@api_view(['POST'])
def cspreport(request):
    try:
        data = json.loads(request.body.decode())
        detail = data['csp-report']['violated-directive']
        logger.error(f'csp error: {detail}', extra=data)
        return Response(None, status=status.HTTP_204_NO_CONTENT)
    except (ValueError, KeyError):
        logger.warn(f'unparsable csp error', extra={'body': request.body.decode()})
        return Response({'error': 'unparsable csp report'}, status=status.HTTP_400_BAD_REQUEST)
