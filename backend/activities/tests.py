from datetime import timedelta
from decimal import Decimal
from unittest.mock import patch

import pytest
from django.utils import timezone
from rest_framework.test import APIRequestFactory, force_authenticate

from activities.models import Activity, ActivityParticipant, Category
from activities.serializers import ActivityCreateSerializer
from activities.views import ActivityViewSet
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


# ── ActivityViewSet API-level flow ────────────────────────────────


def _explorer(email="explorer@example.com"):
    return CustomUser.objects.create_user(
        email=email, password="pw", full_name="Explorer"
    )


def _call(action_map, user, activity, method="post", data=None):
    factory = APIRequestFactory()
    request_method = getattr(factory, method)
    request = request_method(
        f"/api/v1/activities/{activity.pk}/", data=data, format="json"
    )
    force_authenticate(request, user=user)
    view = ActivityViewSet.as_view(action_map)
    return view(request, pk=activity.pk)


@pytest.mark.django_db
def test_join_activity_creates_confirmed_participant(future_activity):
    explorer = _explorer()
    response = _call({"post": "join_activity"}, explorer, future_activity)
    assert response.status_code == 201
    assert response.data["status"] == "confirmed"
    assert ActivityParticipant.objects.filter(
        activity=future_activity, user=explorer, status="confirmed"
    ).exists()


@pytest.mark.django_db
def test_join_activity_twice_returns_400(future_activity):
    explorer = _explorer()
    ActivityParticipant.objects.create(
        activity=future_activity, user=explorer, status="confirmed"
    )
    response = _call({"post": "join_activity"}, explorer, future_activity)
    assert response.status_code == 400
    assert "already joined" in response.data["detail"].lower()


@pytest.mark.django_db
def test_join_paid_activity_without_payment_returns_402(future_activity):
    future_activity.is_free = False
    future_activity.price = Decimal("10000")
    future_activity.save()

    explorer = _explorer()
    response = _call({"post": "join_activity"}, explorer, future_activity)
    assert response.status_code == 402
    assert not ActivityParticipant.objects.filter(
        activity=future_activity, user=explorer
    ).exists()


@pytest.mark.django_db
def test_join_paid_activity_with_succeeded_payment_confirms(future_activity):
    from payments.models import Payment

    future_activity.is_free = False
    future_activity.price = Decimal("10000")
    future_activity.save()

    explorer = _explorer()
    Payment.objects.create(
        user=explorer,
        activity=future_activity,
        amount=Decimal("10000"),
        status="succeeded",
    )

    response = _call({"post": "join_activity"}, explorer, future_activity)
    assert response.status_code == 201
    assert response.data["status"] == "confirmed"


@pytest.mark.django_db
def test_join_full_activity_lands_on_waitlist(future_activity):
    for i in range(future_activity.capacity):
        u = CustomUser.objects.create_user(
            email=f"fill{i}@example.com", password="pw", full_name=f"Fill{i}"
        )
        ActivityParticipant.objects.create(
            activity=future_activity, user=u, status="confirmed"
        )

    explorer = _explorer()
    response = _call({"post": "join_activity"}, explorer, future_activity)
    assert response.status_code == 201
    assert response.data["status"] == "waitlisted"


@pytest.mark.django_db
def test_leave_activity_promotes_next_waitlisted(future_activity):
    confirmed_user = _explorer("confirmed@example.com")
    confirmed = ActivityParticipant.objects.create(
        activity=future_activity, user=confirmed_user, status="confirmed"
    )
    waitlisted_user = _explorer("waitlisted@example.com")
    waitlisted = ActivityParticipant.objects.create(
        activity=future_activity, user=waitlisted_user, status="waitlisted"
    )

    response = _call(
        {"post": "leave_activity"}, confirmed_user, future_activity
    )
    assert response.status_code == 200

    confirmed.refresh_from_db()
    waitlisted.refresh_from_db()
    assert confirmed.status == "cancelled"
    assert waitlisted.status == "confirmed"


@pytest.mark.django_db
def test_participants_visible_to_organizer(future_activity, user):
    explorer = _explorer()
    ActivityParticipant.objects.create(
        activity=future_activity, user=explorer, status="confirmed"
    )
    response = _call({"get": "participants"}, user, future_activity, method="get")
    assert response.status_code == 200
    assert len(response.data) == 1


@pytest.mark.django_db
def test_participants_forbidden_for_non_organizer(future_activity):
    outsider = _explorer("outsider@example.com")
    response = _call(
        {"get": "participants"}, outsider, future_activity, method="get"
    )
    assert response.status_code == 403


@pytest.mark.django_db
def test_remove_participant_by_organizer_promotes_waitlisted(future_activity, user):
    confirmed_user = _explorer("confirmed2@example.com")
    confirmed = ActivityParticipant.objects.create(
        activity=future_activity, user=confirmed_user, status="confirmed"
    )
    waitlisted_user = _explorer("waitlisted2@example.com")
    waitlisted = ActivityParticipant.objects.create(
        activity=future_activity, user=waitlisted_user, status="waitlisted"
    )

    response = _call(
        {"post": "remove_participant"},
        user,
        future_activity,
        data={"user_id": confirmed_user.id},
    )
    assert response.status_code == 200

    confirmed.refresh_from_db()
    waitlisted.refresh_from_db()
    assert confirmed.status == "cancelled"
    assert waitlisted.status == "confirmed"


@pytest.mark.django_db
def test_remove_participant_forbidden_for_non_organizer(future_activity):
    explorer = _explorer()
    participant = ActivityParticipant.objects.create(
        activity=future_activity, user=explorer, status="confirmed"
    )
    outsider = _explorer("outsider2@example.com")
    response = _call(
        {"post": "remove_participant"},
        outsider,
        future_activity,
        data={"user_id": explorer.id},
    )
    assert response.status_code == 403
    participant.refresh_from_db()
    assert participant.status == "confirmed"


@pytest.mark.django_db
def test_create_activity_via_api_succeeds(user, category):
    organizer = CustomUser.objects.create_user(
        email="newowner@example.com", password="pw", full_name="New Owner"
    )
    start = timezone.now() + timedelta(days=1)
    payload = {
        "title": "New Activity",
        "description": "desc",
        "category": category.pk,
        "location_name": "Place",
        "latitude": "-33.45",
        "longitude": "-70.65",
        "start_datetime": start.isoformat(),
        "end_datetime": (start + timedelta(hours=3)).isoformat(),
        "capacity": 10,
    }
    factory = APIRequestFactory()
    request = factory.post("/api/v1/activities/", payload, format="json")
    force_authenticate(request, user=organizer)
    view = ActivityViewSet.as_view({"post": "create"})

    with patch("requests.post") as mock_post:
        response = view(request)

    # OPENAI_API_KEY is empty in test settings, so moderation fails open
    # without ever calling the network.
    assert mock_post.called is False
    assert response.status_code == 201
    assert Activity.objects.filter(title="New Activity", organizer=organizer).exists()
