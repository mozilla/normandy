from rest_framework import serializers, views, status
from rest_framework.response import Response

from normandy.classifier.serializers import BundleSerializer
from normandy.classifier.models import Bundle, Client


class FetchBundle(views.APIView):
    authentication_classes = []
    permission_classes = []
    serializer_class = BundleSerializer

    class Parameters(serializers.Serializer):
        locale = serializers.CharField(default=None)

    def post(self, request, format=None):
        """
        Determine the recipes that matches the requesting client.
        """
        params = self.Parameters(data=request.POST)
        if not params.is_valid():
            return Response(params.errors, status=status.HTTP_400_BAD_REQUEST)

        client = Client(request, locale=params.data['locale'])
        bundle = Bundle.for_client(client)
        serializer = self.serializer_class(bundle, context={'request': request})
        return Response(serializer.data)
