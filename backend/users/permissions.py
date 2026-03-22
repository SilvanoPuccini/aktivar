from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsOrganizer(BasePermission):
    """Allow access only to users who can organize activities."""

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.can_organize
        )


class IsDriver(BasePermission):
    """Allow access only to verified drivers."""

    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        if request.user.role != 'driver':
            return False
        return (
            hasattr(request.user, 'driver_profile')
            and request.user.driver_profile.is_verified_driver
        )


class IsVerifiedUser(BasePermission):
    """Allow access only to users with a verified email."""

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.is_verified_email
        )


class IsOwnerOrReadOnly(BasePermission):
    """Allow write access only to the owner of the object."""

    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True
        return obj == request.user
