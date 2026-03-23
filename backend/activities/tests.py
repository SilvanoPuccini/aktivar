from datetime import timedelta
from decimal import Decimal

import pytest
from django.utils import timezone
from rest_framework.test import APIRequestFactory

from activities.models import Activity, ActivityParticipant, Category
from activities.serializers import ActivityCreateSerializer
from activities.weather import _wmo_code_to_description
from users.models import CustomUser


# ── Helpers ──────────────────────────────────────────────────────


@pytest.fixture
def user(db):
    return CustomUser.objects.create_user(
        email="organizer@example.com", password="pw", full_name="Organizer"
    )


@pytest.fixture
def category(db):
    return Category.objects.create(name="Senderismo", slug="senderismo")


@pytest.fixture
def future_activity(user, category):
    return Activity.objects.create(
        title="Hike",
        description="A nice hike",
        category=category,
        organizer=user,
        location_name="Mountain",
        latitude=Decimal("-33.4500000"),
        longitude=Decimal("-70.6500000"),
        start_datetime=timezone.now() + timedelta(days=3),
        end_datetime=timezone.now() + timedelta(days=3, hours=4),
        capacity=5,
    )


# ── Category ─────────────────────────────────────────────────────


@pytest.mark.django_db
def test_category_str():
    cat = Category.objects.create(name="Ciclismo", slug="ciclismo")
    assert str(cat) == "Ciclismo"


# ── Activity ─────────────────────────────────────────────────────


@pytest.mark.django_db
def test_activity_creation(future_activity):
    assert future_activity.pk is not None
    assert future_activity.title == "Hike"
    assert future_activity.status == "draft"


@pytest.mark.django_db
def test_activity_spots_remaining_starts_at_capacity(future_activity):
    assert future_activity.spots_remaining == 5
    assert future_activity.is_full is False


@pytest.mark.django_db
def test_activity_is_full_when_no_spots(future_activity):
    for i in range(5):
        u = CustomUser.objects.create_user(
            email=f"p{i}@example.com", password="pw", full_name=f"P{i}"
        )
        ActivityParticipant.objects.create(
            activity=future_activity, user=u, status="confirmed"
        )
    assert future_activity.spots_remaining == 0
    assert future_activity.is_full is True


@pytest.mark.django_db
def test_activity_spots_remaining_ignores_non_confirmed(future_activity):
    u = CustomUser.objects.create_user(
        email="pending@example.com", password="pw", full_name="Pending"
    )
    ActivityParticipant.objects.create(
        activity=future_activity, user=u, status="pending"
    )
    assert future_activity.spots_remaining == 5


# ── ActivityParticipant ──────────────────────────────────────────


@pytest.mark.django_db
def test_participant_creation(future_activity):
    u = CustomUser.objects.create_user(
        email="joiner@example.com", password="pw", full_name="Joiner"
    )
    p = ActivityParticipant.objects.create(
        activity=future_activity, user=u, status="confirmed"
    )
    assert p.pk is not None
    assert p.status == "confirmed"
    assert str(p) == f"{u} - {future_activity}"


@pytest.mark.django_db
def test_participant_unique_together(future_activity):
    u = CustomUser.objects.create_user(
        email="dup@example.com", password="pw", full_name="Dup"
    )
    ActivityParticipant.objects.create(
        activity=future_activity, user=u, status="confirmed"
    )
    from django.db import IntegrityError

    with pytest.raises(IntegrityError):
        ActivityParticipant.objects.create(
            activity=future_activity, user=u, status="pending"
        )


# ── ActivityCreateSerializer validation ──────────────────────────


@pytest.mark.django_db
def test_serializer_rejects_past_start_datetime(user, category):
    factory = APIRequestFactory()
    request = factory.post("/")
    request.user = user

    data = {
        "title": "Old",
        "description": "desc",
        "category": category.pk,
        "location_name": "Place",
        "latitude": "-33.45",
        "longitude": "-70.65",
        "start_datetime": (timezone.now() - timedelta(hours=1)).isoformat(),
        "end_datetime": (timezone.now() + timedelta(hours=2)).isoformat(),
        "capacity": 10,
    }
    s = ActivityCreateSerializer(data=data, context={"request": request})
    assert s.is_valid() is False
    assert "start_datetime" in s.errors


@pytest.mark.django_db
def test_serializer_rejects_end_before_start(user, category):
    factory = APIRequestFactory()
    request = factory.post("/")
    request.user = user

    start = timezone.now() + timedelta(days=1)
    data = {
        "title": "Bad",
        "description": "desc",
        "category": category.pk,
        "location_name": "Place",
        "latitude": "-33.45",
        "longitude": "-70.65",
        "start_datetime": start.isoformat(),
        "end_datetime": (start - timedelta(hours=1)).isoformat(),
        "capacity": 10,
    }
    s = ActivityCreateSerializer(data=data, context={"request": request})
    assert s.is_valid() is False
    assert "end_datetime" in s.errors


@pytest.mark.django_db
def test_serializer_accepts_valid_data(user, category):
    factory = APIRequestFactory()
    request = factory.post("/")
    request.user = user

    start = timezone.now() + timedelta(days=1)
    data = {
        "title": "Good",
        "description": "desc",
        "category": category.pk,
        "location_name": "Place",
        "latitude": "-33.45",
        "longitude": "-70.65",
        "start_datetime": start.isoformat(),
        "end_datetime": (start + timedelta(hours=3)).isoformat(),
        "capacity": 10,
    }
    s = ActivityCreateSerializer(data=data, context={"request": request})
    assert s.is_valid(), s.errors


# ── Weather WMO codes ────────────────────────────────────────────


def test_wmo_code_despejado():
    assert _wmo_code_to_description(0) == "Despejado"


def test_wmo_code_lluvia_fuerte():
    assert _wmo_code_to_description(65) == "Lluvia fuerte"


def test_wmo_code_tormenta():
    assert _wmo_code_to_description(95) == "Tormenta"


def test_wmo_code_unknown_falls_back_to_despejado():
    assert _wmo_code_to_description(999) == "Despejado"
