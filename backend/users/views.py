import logging

from django.conf import settings
from rest_framework import generics, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle, UserRateThrottle
from rest_framework.views import APIView

from .models import CustomUser, EmailVerificationToken, PhoneVerificationOTP
from .serializers import (
    RequestPhoneVerificationSerializer,
    UserProfileSerializer,
    UserRegistrationSerializer,
    UserSerializer,
    VerifyEmailSerializer,
    VerifyPhoneSerializer,
)

logger = logging.getLogger(__name__)


# ── Custom Throttles ──────────────────────────────────────────────

class AuthRateThrottle(AnonRateThrottle):
    """5 requests/hour for auth endpoints (login, register)."""
    rate = '5/hour'
    scope = 'auth'


class OTPRateThrottle(UserRateThrottle):
    """3 requests/hour for OTP/verification requests."""
    rate = '3/hour'
    scope = 'otp'


class JoinRateThrottle(UserRateThrottle):
    """10 requests/hour for join-activity actions."""
    rate = '10/hour'
    scope = 'join'


# ── User ViewSet ──────────────────────────────────────────────────

class UserViewSet(viewsets.ModelViewSet):
    queryset = CustomUser.objects.filter(deleted_at__isnull=True)
    serializer_class = UserSerializer

    def get_permissions(self):
        if self.action == 'create':
            return [AllowAny()]
        return [IsAuthenticated()]

    def perform_create(self, serializer):
        serializer.save()

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
    throttle_classes = [AuthRateThrottle]


# ── Email Verification ───────────────────────────────────────────

class RequestEmailVerificationView(APIView):
    """Send a verification email with a unique token link."""
    permission_classes = [IsAuthenticated]
    throttle_classes = [OTPRateThrottle]

    def post(self, request):
        user = request.user

        if user.is_verified_email:
            return Response(
                {'detail': 'Email already verified.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Invalidate previous unused tokens
        EmailVerificationToken.objects.filter(
            user=user, used_at__isnull=True
        ).delete()

        token_obj = EmailVerificationToken.create_for_user(user)

        # Build verification URL
        frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')
        verify_url = f"{frontend_url}/verify-email?token={token_obj.token}"

        # Send via Celery task (Resend integration)
        from notifications.tasks import send_verification_email
        send_verification_email.delay(user.id, user.email, verify_url)

        logger.info('Email verification requested for user=%d', user.id)
        return Response({'detail': 'Verification email sent.'})


class VerifyEmailView(APIView):
    """Verify email address with token from email link."""
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = VerifyEmailSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            token_obj = EmailVerificationToken.objects.select_related('user').get(
                token=serializer.validated_data['token']
            )
        except EmailVerificationToken.DoesNotExist:
            return Response(
                {'detail': 'Invalid or expired token.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not token_obj.is_valid:
            return Response(
                {'detail': 'Token has expired or already been used.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        token_obj.mark_used()
        user = token_obj.user
        user.is_verified_email = True
        user.save(update_fields=['is_verified_email'])

        logger.info('Email verified for user=%d', user.id)
        return Response({'detail': 'Email verified successfully.'})


# ── Phone Verification (OTP) ─────────────────────────────────────

class RequestPhoneVerificationView(APIView):
    """Send a 6-digit OTP to the user's phone number."""
    permission_classes = [IsAuthenticated]
    throttle_classes = [OTPRateThrottle]

    def post(self, request):
        serializer = RequestPhoneVerificationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = request.user
        phone = serializer.validated_data['phone']

        if user.is_verified_phone:
            return Response(
                {'detail': 'Phone already verified.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Update phone number on user
        user.phone = phone
        user.save(update_fields=['phone'])

        # Invalidate previous unused OTPs
        PhoneVerificationOTP.objects.filter(
            user=user, used_at__isnull=True
        ).delete()

        otp_obj = PhoneVerificationOTP.create_for_user(user)

        # Send via Celery task (Twilio/WhatsApp integration)
        from notifications.tasks import send_phone_otp
        send_phone_otp.delay(user.id, phone, otp_obj.otp)

        logger.info('Phone OTP requested for user=%d', user.id)
        return Response({'detail': 'OTP sent to your phone.'})


class VerifyPhoneView(APIView):
    """Verify phone number with OTP code."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = VerifyPhoneSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = request.user
        otp_code = serializer.validated_data['otp']

        try:
            otp_obj = PhoneVerificationOTP.objects.filter(
                user=user, used_at__isnull=True
            ).latest('created_at')
        except PhoneVerificationOTP.DoesNotExist:
            return Response(
                {'detail': 'No pending OTP found. Request a new one.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not otp_obj.is_valid:
            return Response(
                {'detail': 'OTP expired or too many attempts. Request a new one.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if otp_obj.otp != otp_code:
            otp_obj.increment_attempts()
            remaining = 5 - otp_obj.attempts
            return Response(
                {'detail': f'Invalid OTP. {remaining} attempts remaining.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        otp_obj.mark_used()
        user.is_verified_phone = True
        user.save(update_fields=['is_verified_phone'])

        logger.info('Phone verified for user=%d', user.id)
        return Response({'detail': 'Phone verified successfully.'})
