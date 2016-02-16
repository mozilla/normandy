from django.conf import settings

from rest_framework import permissions


class AdminEnabled(permissions.BasePermission):
    """Don't allow any actions when settings.ADMIN_ENABLED == False."""

    message = 'This API is unavailable on non-admin servers'

    def has_permission(self, request, view):
        return settings.ADMIN_ENABLED
