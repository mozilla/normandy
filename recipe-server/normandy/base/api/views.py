from rest_framework import status
from rest_framework.views import APIView, Response

from normandy.base.api.serializers import UserSerializer


class CurrentUserView(APIView):
    def get(self, request):
        if not request.user.is_authenticated():
            return Response(status=status.HTTP_401_UNAUTHORIZED)

        return Response(UserSerializer(request.user).data)
