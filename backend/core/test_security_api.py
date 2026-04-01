import pytest
from activities.models import Category
from activities.serializers import ActivityCreateSerializer
from core.sanitization import HAS_BLEACH
from users.models import CustomUser
from users.serializers import UserRegistrationSerializer
from rest_framework.test import APIRequestFactory
from django.utils import timezone
from datetime import timedelta


@pytest.fixture
def request_factory():
    return APIRequestFactory()


@pytest.fixture
def user(db):
    return CustomUser.objects.create_user(
        email="security@example.com",
        password="strong-pass-123",
        full_name="Security Tester",
    )


@pytest.fixture
def category(db):
    return Category.objects.create(name="Trail Running", slug="trail-running")


@pytest.mark.django_db
def test_activity_creation_serializer_sanitizes_html_input(request_factory, user, category):
    """
    Ensures dangerous markup is stripped from user content at serializer level.
    """
    request = request_factory.post("/api/v1/activities/")
    request.user = user
    start = timezone.now() + timedelta(days=1)

    payload = {
        "title": '<img src=x onerror=alert("xss")>Atardecer en cerro',
        "description": '<script>alert("xss")</script><b>Salida segura</b>',
        "category": category.id,
        "location_name": '<svg onload=alert(1)>Punto de encuentro',
        "latitude": "-33.4500",
        "longitude": "-70.6500",
        "start_datetime": start.isoformat(),
        "end_datetime": (start + timedelta(hours=2)).isoformat(),
        "capacity": 8,
        "price": "0.00",
    }

    serializer = ActivityCreateSerializer(data=payload, context={"request": request})
    assert serializer.is_valid(), serializer.errors
    validated = serializer.validated_data

    if HAS_BLEACH:
        assert "<script" not in validated["description"].lower()
        assert "onerror" not in validated["title"].lower()
        assert "<svg" not in validated["location_name"].lower()


@pytest.mark.django_db
def test_registration_serializer_sanitizes_html_full_name():
    serializer = UserRegistrationSerializer(
        data={
            "email": "clean-name@example.com",
            "password": "password123",
            "full_name": '<img src=x onerror=alert("xss")>Nombre',
        }
    )
    assert serializer.is_valid(), serializer.errors
    if HAS_BLEACH:
        assert "onerror" not in serializer.validated_data["full_name"].lower()
