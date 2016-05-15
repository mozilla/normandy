from django.http import Http404

from rest_framework.viewsets import ModelViewSet


class UpdateOrCreateModelViewSet(ModelViewSet):
    def update(self, request, *args, **kwargs):
        """
        Intercept PUT requests and have them create instead of update
        if the object does not exist.
        """
        if request.method in ['PUT', 'PATCH']:
            try:
                self.get_object()
            except Http404:
                if request.method == 'PUT':
                    return self.create(request, *args, **kwargs)

        return super().update(request, *args, **kwargs)
