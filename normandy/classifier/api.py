from rest_framework import views
from rest_framework.response import Response

from normandy.classifier.serializers import BundleSerializer
from normandy.classifier.models import Bundle, Client
from normandy.base.decorators import short_circuit_middlewares


class FetchBundle(views.APIView):
    authentication_classes = []
    permission_classes = []
    serializer_class = BundleSerializer

    @classmethod
    def as_view(cls, **initkwargs):
        view = super().as_view(**initkwargs)
        # Apply the short circuit middleware
        return short_circuit_middlewares(view)

    def post(self, request, format=None):
        """
        Determine the recipes that matches the requesting client.
        """
        client = Client(request)
        bundle = Bundle.for_client(client)
        serializer = self.serializer_class(bundle, context={'request': request})
        return Response(serializer.data)
