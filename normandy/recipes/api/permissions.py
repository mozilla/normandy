from django.conf import settings

from rest_framework import permissions


class NotInUse(permissions.BasePermission):
    """Only allows editing of objects if object.in_use is False."""
    def has_object_permission(self, request, view, obj):
        unsafe_method = request.method not in permissions.SAFE_METHODS
        if not settings.CAN_EDIT_ACTIONS_IN_USE and unsafe_method and obj.in_use:
            return False
        else:
            return True
