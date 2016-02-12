from rest_framework import permissions


class NotInUse(permissions.BasePermission):
    """Only allows editing of objects if object.in_use is False."""
    def has_object_permission(self, request, view, obj):
        if request.method not in permissions.SAFE_METHODS and obj.in_use:
            return False
        else:
            return True
