import pytest
from rest_framework.test import APIRequestFactory, force_authenticate

from notifications.models import Notification
from notifications.views import NotificationViewSet
from users.models import CustomUser


@pytest.fixture
def user(db):
    return CustomUser.objects.create_user(
        email="notif-user@example.com", password="pw", full_name="Notif User"
    )


@pytest.fixture
def other_user(db):
    return CustomUser.objects.create_user(
        email="notif-other@example.com", password="pw", full_name="Other User"
    )


def _mark_read(actor, notification):
    factory = APIRequestFactory()
    request = factory.post(f"/api/v1/notifications/{notification.pk}/mark_read/")
    force_authenticate(request, user=actor)
    view = NotificationViewSet.as_view({"post": "mark_read"})
    return view(request, pk=notification.pk)


@pytest.mark.django_db
def test_mark_read_flips_is_read(user):
    notification = Notification.objects.create(
        user=user,
        notification_type="system",
        title="Hello",
        body="World",
    )
    assert notification.is_read is False

    response = _mark_read(user, notification)
    assert response.status_code == 200

    notification.refresh_from_db()
    assert notification.is_read is True


@pytest.mark.django_db
def test_mark_all_read_flips_all_unread_for_user(user):
    for i in range(3):
        Notification.objects.create(
            user=user,
            notification_type="system",
            title=f"Notif {i}",
            body="Body",
        )

    factory = APIRequestFactory()
    request = factory.post("/api/v1/notifications/mark_all_read/")
    force_authenticate(request, user=user)
    view = NotificationViewSet.as_view({"post": "mark_all_read"})
    response = view(request)

    assert response.status_code == 200
    assert response.data["updated"] == 3
    assert Notification.objects.filter(user=user, is_read=False).count() == 0


@pytest.mark.django_db
def test_user_cannot_mark_another_users_notification_as_read(user, other_user):
    """
    NotificationViewSet.get_queryset() filters strictly by
    Notification.objects.filter(user=self.request.user), and mark_read()
    uses self.get_object() which is built from that queryset. So a
    cross-user mark_read lookup 404s instead of succeeding. This test
    verifies that real, currently-correct behavior.
    """
    notification = Notification.objects.create(
        user=other_user,
        notification_type="system",
        title="Not yours",
        body="Body",
    )

    response = _mark_read(user, notification)
    assert response.status_code == 404

    notification.refresh_from_db()
    assert notification.is_read is False


@pytest.mark.django_db
def test_unauthenticated_user_cannot_list_notifications():
    factory = APIRequestFactory()
    request = factory.get("/api/v1/notifications/")
    view = NotificationViewSet.as_view({"get": "list"})
    response = view(request)
    assert response.status_code == 401
