from django.shortcuts import get_object_or_404

from rest_framework import status, permissions, views
from rest_framework.response import Response
from rest_framework.authtoken.models import Token

from normandy.base.api.serializers import TokenSerializer


class TokenView(views.APIView):
    """
    Manages API tokens.
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer = TokenSerializer

    def get(self, request):
        token, created = Token.objects.get_or_create(user=request.user)
        serializer = self.serializer(token)
        return Response(serializer.data, status=201 if created else 200)

    def delete(self, request):
        token = get_object_or_404(Token, user=request.user)
        token.delete()
        return Response(None, status=status.HTTP_204_NO_CONTENT)
