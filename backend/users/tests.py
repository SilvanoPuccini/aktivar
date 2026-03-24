from datetime import timedelta

import pytest
from django.test import override_settings
from django.utils import timezone
from rest_framework.exceptions import ValidationError
from rest_framework.test import APIRequestFactory, force_authenticate

from users.models import (
    CustomUser,
    EmailVerificationToken,
    PhoneVerificationOTP,
    UserProfile,
)
from users.serializers import UserRegistrationSerializer
from users.views import RegisterView, UserViewSet, AuthTokenObtainPairView
from rest_framework.throttling import AnonRateThrottle


# ── CustomUser creation ──────────────────────────────────────────


@pytest.mark.django_db
def test_create_user_with_email_and_full_name():
    user = CustomUser.objects.create_user(
        email="alice@example.com", password="secret123", full_name="Alice Test"
    )
    assert user.email == "alice@example.com"
    assert user.full_name == "Alice Test"
    assert user.check_password("secret123")
    assert user.is_active is True
    assert user.is_staff is False


@pytest.mark.django_db
def test_create_user_without_email_raises():
    with pytest.raises(ValueError, match="Email"):
        CustomUser.objects.create_user(email="", password="secret123", full_name="X")


@pytest.mark.django_db
def test_create_superuser():
    su = CustomUser.objects.create_superuser(
        email="admin@example.com", password="admin123", full_name="Admin"
    )
    assert su.is_staff is True
    assert su.is_superuser is True


@pytest.mark.django_db
def test_user_str_returns_display_name():
    user = CustomUser.objects.create_user(
        email="bob@example.com", password="pw", full_name="Bob Builder"
    )
    assert str(user) == "Bob Builder"


@pytest.mark.django_db
def test_user_str_falls_back_to_email_local():
    user = CustomUser.objects.create_user(
        email="carol@example.com", password="pw", full_name=""
    )
    assert str(user) == "carol"


# ── UserProfile auto-creation signal ────────────────────────────


@pytest.mark.django_db
def test_user_profile_created_on_user_create():
    user = CustomUser.objects.create_user(
        email="signal@example.com", password="pw", full_name="Signal"
    )
    assert UserProfile.objects.filter(user=user).exists()
    assert user.profile.avg_rating == 0
    assert user.profile.total_reviews == 0


# ── EmailVerificationToken ──────────────────────────────────────


@pytest.mark.django_db
def test_email_token_create_for_user():
    user = CustomUser.objects.create_user(
        email="tok@example.com", password="pw", full_name="Tok"
    )
    token = EmailVerificationToken.create_for_user(user)
    assert token.pk is not None
    assert len(token.token) > 0
    assert token.user == user
    assert token.used_at is None


@pytest.mark.django_db
def test_email_token_is_valid_when_fresh():
    user = CustomUser.objects.create_user(
        email="fresh@example.com", password="pw", full_name="Fresh"
    )
    token = EmailVerificationToken.create_for_user(user)
    assert token.is_valid is True
    assert token.is_expired is False


@pytest.mark.django_db
def test_email_token_is_expired_after_24h():
    user = CustomUser.objects.create_user(
        email="old@example.com", password="pw", full_name="Old"
    )
    token = EmailVerificationToken.create_for_user(user)
    # Force created_at into the past
    EmailVerificationToken.objects.filter(pk=token.pk).update(
        created_at=timezone.now() - timedelta(hours=25)
    )
    token.refresh_from_db()
    assert token.is_expired is True
    assert token.is_valid is False


@pytest.mark.django_db
def test_email_token_mark_used():
    user = CustomUser.objects.create_user(
        email="used@example.com", password="pw", full_name="Used"
    )
    token = EmailVerificationToken.create_for_user(user)
    token.mark_used()
    token.refresh_from_db()
    assert token.used_at is not None
    assert token.is_valid is False


# ── PhoneVerificationOTP ────────────────────────────────────────


@pytest.mark.django_db
def test_phone_otp_create_for_user():
    user = CustomUser.objects.create_user(
        email="otp@example.com", password="pw", full_name="OTP"
    )
    otp = PhoneVerificationOTP.create_for_user(user)
    assert otp.pk is not None
    assert len(otp.otp) == 6
    assert otp.otp.isdigit()
    assert otp.attempts == 0


@pytest.mark.django_db
def test_phone_otp_is_valid_when_fresh():
    user = CustomUser.objects.create_user(
        email="votp@example.com", password="pw", full_name="VOTP"
    )
    otp = PhoneVerificationOTP.create_for_user(user)
    assert otp.is_valid is True


@pytest.mark.django_db
def test_phone_otp_increment_attempts():
    user = CustomUser.objects.create_user(
        email="att@example.com", password="pw", full_name="Att"
    )
    otp = PhoneVerificationOTP.create_for_user(user)
    for _ in range(5):
        otp.increment_attempts()
    otp.refresh_from_db()
    assert otp.attempts == 5
    assert otp.is_valid is False


@pytest.mark.django_db
def test_phone_otp_expired_after_10_min():
    user = CustomUser.objects.create_user(
        email="exp@example.com", password="pw", full_name="Exp"
    )
    otp = PhoneVerificationOTP.create_for_user(user)
    PhoneVerificationOTP.objects.filter(pk=otp.pk).update(
        created_at=timezone.now() - timedelta(minutes=11)
    )
    otp.refresh_from_db()
    assert otp.is_expired is True
    assert otp.is_valid is False


# ── Registration robustness ──────────────────────────────────────


@pytest.mark.django_db
def test_registration_serializer_handles_duplicate_email():
    CustomUser.objects.create_user(
        email="repeat@example.com", password="password123", full_name="First User"
    )

    serializer = UserRegistrationSerializer(
        data={
            "email": "repeat@example.com",
            "password": "password123",
            "full_name": "Second User",
        }
    )
    assert not serializer.is_valid()
    assert "email" in serializer.errors


@pytest.mark.django_db
def test_registration_serializer_handles_duplicate_phone():
    CustomUser.objects.create_user(
        email="phone1@example.com",
        password="password123",
        full_name="Phone One",
        phone="+5491111111111",
    )

    serializer = UserRegistrationSerializer(
        data={
            "email": "phone2@example.com",
            "password": "password123",
            "full_name": "Phone Two",
            "phone": "+5491111111111",
        }
    )
    assert serializer.is_valid(), serializer.errors
    with pytest.raises(ValidationError) as exc:
        serializer.save()
    assert "phone" in exc.value.detail


@pytest.mark.django_db
@override_settings(
    CACHES={
        "default": {
            "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
            "LOCATION": "test-auth-flow-cache",
        }
    }
)
def test_auth_flow_register_login_profile():
    factory = APIRequestFactory()

    register_view = RegisterView.as_view()
    register_request = factory.post(
        "/api/v1/users/register/",
        {
            "email": "flow@example.com",
            "password": "password123",
            "full_name": "Flow User",
        },
        format="json",
    )
    register_response = register_view(register_request)
    assert register_response.status_code == 201

    login_view = AuthTokenObtainPairView.as_view()
    login_request = factory.post(
        "/api/v1/auth/token/",
        {"email": "flow@example.com", "password": "password123"},
        format="json",
    )
    login_response = login_view(login_request)
    assert login_response.status_code == 200
    assert "access" in login_response.data

    user = CustomUser.objects.get(email="flow@example.com")
    me_view = UserViewSet.as_view({"get": "me"})
    me_request = factory.get("/api/v1/users/me/")
    force_authenticate(me_request, user=user)
    me_response = me_view(me_request)

    assert me_response.status_code == 200
    assert me_response.data["email"] == "flow@example.com"
    assert me_response.data["full_name"] == "Flow User"


@pytest.mark.django_db
def test_auth_rate_throttle_allows_request_when_cache_fails(monkeypatch):
    factory = APIRequestFactory()
    request = factory.post("/api/v1/users/register/", {}, format="json")

    def broken_allow_request(self, request, view):
        raise RuntimeError("cache down")

    monkeypatch.setattr(AnonRateThrottle, "allow_request", broken_allow_request)

    throttle = RegisterView.throttle_classes[0]()
    assert throttle.allow_request(request, RegisterView()) is True
