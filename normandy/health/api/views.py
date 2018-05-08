import json
import logging

from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response


logger = logging.getLogger(__name__)


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
