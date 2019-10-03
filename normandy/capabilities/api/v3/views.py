from django.conf import settings

from rest_framework.response import Response
from rest_framework.views import APIView

from normandy.capabilities.api.v3.serializers import CapabilitiesInfoSerializer
from normandy.base.decorators import api_cache_control
from normandy.recipes.models import Recipe


class CapabilitiesView(APIView):
    @api_cache_control()
    def get(self, request):
        capabilities = {}

        for cap in settings.BASELINE_CAPABILITIES:
            capabilities[cap] = {"is_baseline": True}

        for recipe in Recipe.objects.all():
            for cap in recipe.capabilities:
                capabilities.setdefault(cap, {"is_baseline": False})

        return Response(CapabilitiesInfoSerializer({"capabilities": capabilities}).data)
