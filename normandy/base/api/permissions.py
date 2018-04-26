from django.conf import settings

from rest_framework import permissions


class AdminEnabled(permissions.BasePermission):
    """Don't allow any actions when settings.ADMIN_ENABLED == False."""

    message = 'This API is unavailable on non-admin servers'

    def has_permission(self, request, view):
        return settings.ADMIN_ENABLED


class AdminEnabledOrReadOnly(AdminEnabled):
    """Don't allow any unsafe actions when the admin isn't enabled."""

    message = 'This API is read-only on non-admin servers'

    def has_permission(self, request, view):
        return super().has_permission(request, view) or request.method in permissions.SAFE_METHODS
