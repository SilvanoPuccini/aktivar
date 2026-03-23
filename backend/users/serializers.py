from rest_framework import serializers

from core.sanitization import SanitizeMixin

from .models import CustomUser, DriverProfile, UserProfile


class UserProfileSerializer(SanitizeMixin, serializers.ModelSerializer):
    sanitize_fields = ['bio_extended', 'location_name']

    class Meta:
        model = UserProfile
        fields = [
            'id',
            'location_name',
            'latitude',
            'longitude',
            'bio_extended',
            'website',
            'instagram',
            'total_activities',
            'total_km',
            'total_people_met',
            'badges',
        ]


class DriverProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = DriverProfile
        fields = [
            'id',
            'user',
            'license_number',
            'license_photo',
            'license_expiry',
            'is_verified_driver',
            'driver_rating',
            'total_trips',
            'vehicle_info',
            'created_at',
        ]
        read_only_fields = ['id', 'created_at']


class UserSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(read_only=True)

    class Meta:
        model = CustomUser
        fields = [
            'id',
            'email',
            'phone',
            'full_name',
            'avatar',
            'bio',
            'role',
            'is_verified_email',
            'is_verified_phone',
            'is_active',
            'is_staff',
            'created_at',
            'updated_at',
            'profile',
        ]
        read_only_fields = [
            'id',
            'is_verified_email',
            'is_verified_phone',
            'is_active',
            'is_staff',
            'created_at',
            'updated_at',
        ]


class UserRegistrationSerializer(SanitizeMixin, serializers.ModelSerializer):
    sanitize_fields = ['full_name']
    password = serializers.CharField(write_only=True, min_length=8)
    phone = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = CustomUser
        fields = ['email', 'password', 'full_name', 'phone']

    def create(self, validated_data):
        return CustomUser.objects.create_user(**validated_data)


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField()


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField()
    new_password = serializers.CharField(min_length=8)


class RequestEmailVerificationSerializer(serializers.Serializer):
    """Triggers sending a verification email to the authenticated user."""
    pass


class VerifyEmailSerializer(serializers.Serializer):
    token = serializers.CharField(max_length=64)


class RequestPhoneVerificationSerializer(serializers.Serializer):
    phone = serializers.CharField(max_length=20)


class VerifyPhoneSerializer(serializers.Serializer):
    otp = serializers.CharField(max_length=6, min_length=6)
