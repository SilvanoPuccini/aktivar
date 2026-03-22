from rest_framework.permissions import BasePermission


class IsDriverVerified(BasePermission):
    """Allow access only to users with a verified driver profile."""

    message = 'You must have a verified driver profile to perform this action.'

    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        try:
            return request.user.driver_profile.is_verified_driver
        except AttributeError:
            return False


class IsTripDriver(BasePermission):
    """Allow access only to the driver of the trip."""

    message = 'You must be the driver of this trip to perform this action.'

    def has_object_permission(self, request, view, obj):
        return obj.driver == request.user
