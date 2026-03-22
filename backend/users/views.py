from rest_framework import generics, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from .models import CustomUser
from .serializers import (
    UserProfileSerializer,
    UserRegistrationSerializer,
    UserSerializer,
)


class UserViewSet(viewsets.ModelViewSet):
    queryset = CustomUser.objects.filter(deleted_at__isnull=True)
    serializer_class = UserSerializer

    def get_permissions(self):
        if self.action == 'create':
            return [AllowAny()]
        return [IsAuthenticated()]

    def perform_create(self, serializer):
        # Delegate to registration serializer
        reg_serializer = UserRegistrationSerializer(data=self.request.data)
        reg_serializer.is_valid(raise_exception=True)
        reg_serializer.save()

    def get_serializer_class(self):
        if self.action == 'create':
            return UserRegistrationSerializer
        return UserSerializer

    @action(detail=False, methods=['get'], url_path='me')
    def me(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

    @action(detail=False, methods=['patch'], url_path='me/profile')
    def update_profile(self, request):
        profile = request.user.profile
        serializer = UserProfileSerializer(profile, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    @action(detail=False, methods=['delete'], url_path='me/delete')
    def delete_account(self, request):
        request.user.soft_delete()
        return Response(
            {'detail': 'Account deleted successfully.'},
            status=status.HTTP_204_NO_CONTENT,
        )


class RegisterView(generics.CreateAPIView):
    serializer_class = UserRegistrationSerializer
    permission_classes = [AllowAny]
