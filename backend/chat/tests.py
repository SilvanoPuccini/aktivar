from datetime import timedelta
from decimal import Decimal

import pytest
from django.utils import timezone
from rest_framework.test import APIRequestFactory, force_authenticate

from activities.models import Activity, ActivityParticipant, Category
from chat.models import Message
from chat.views import MessageViewSet
from users.models import CustomUser


@pytest.fixture
def organizer(db):
    return CustomUser.objects.create_user(
        email="chat-organizer@example.com", password="pw", full_name="Organizer"
    )


@pytest.fixture
def category(db):
    return Category.objects.create(name="Chat Category", slug="chat-category")


@pytest.fixture
def activity(organizer, category):
    return Activity.objects.create(
        title="Chat Hike",
        description="A hike with chat",
        category=category,
        organizer=organizer,
        location_name="Mountain",
        latitude=Decimal("-33.4500000"),
        longitude=Decimal("-70.6500000"),
        start_datetime=timezone.now() + timedelta(days=3),
        end_datetime=timezone.now() + timedelta(days=3, hours=4),
        capacity=5,
    )


def _list_messages(user, activity):
    factory = APIRequestFactory()
    request = factory.get(f"/api/v1/chat/activities/{activity.pk}/messages/")
    force_authenticate(request, user=user)
    view = MessageViewSet.as_view({"get": "list"})
    return view(request, activity_id=activity.pk)


@pytest.mark.django_db
def test_participant_can_read_message_history(activity, organizer):
    participant_user = CustomUser.objects.create_user(
        email="joiner@example.com", password="pw", full_name="Joiner"
    )
    ActivityParticipant.objects.create(
        activity=activity, user=participant_user, status="confirmed"
    )
    Message.objects.create(activity=activity, author=organizer, content="Hello!")

    response = _list_messages(participant_user, activity)
    assert response.status_code == 200
    results = response.data["results"]
    assert len(results) == 1
    assert results[0]["content"] == "Hello!"


@pytest.mark.django_db
def test_organizer_can_read_message_history(activity, organizer):
    Message.objects.create(activity=activity, author=organizer, content="Hello!")

    response = _list_messages(organizer, activity)
    assert response.status_code == 200
    assert len(response.data["results"]) == 1


@pytest.mark.django_db
def test_non_participant_denied_message_history(activity, organizer):
    outsider = CustomUser.objects.create_user(
        email="outsider@example.com", password="pw", full_name="Outsider"
    )
    Message.objects.create(activity=activity, author=organizer, content="Secret plan")

    response = _list_messages(outsider, activity)
    assert response.status_code == 403


@pytest.mark.django_db
def test_unauthenticated_user_denied():
    factory = APIRequestFactory()
    request = factory.get("/api/v1/chat/activities/1/messages/")
    view = MessageViewSet.as_view({"get": "list"})
    response = view(request, activity_id=1)
    assert response.status_code == 401
