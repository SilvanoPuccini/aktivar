from datetime import timedelta
from decimal import Decimal

import pytest
from django.utils import timezone

from activities.models import Activity, Category
from transport.models import EmergencyAlert, EmergencyContact, Trip, Vehicle
from users.models import CustomUser


@pytest.fixture
def user(db):
    return CustomUser.objects.create_user(
        email="transport@example.com", password="pw", full_name="Transport User"
    )


@pytest.fixture
def driver(db):
    return CustomUser.objects.create_user(
        email="driver@example.com", password="pw", full_name="Driver"
    )


@pytest.fixture
def vehicle(driver):
    return Vehicle.objects.create(
        owner=driver,
        brand="Toyota",
        model_name="Hilux",
        color="White",
        plate="ABCD12",
        capacity=4,
    )


@pytest.fixture
def trip(driver, vehicle):
    return Trip.objects.create(
        driver=driver,
        vehicle=vehicle,
        origin_name="Santiago",
        origin_latitude=Decimal("-33.4500000"),
        origin_longitude=Decimal("-70.6500000"),
        destination_name="Cajon del Maipo",
        destination_latitude=Decimal("-33.6000000"),
        destination_longitude=Decimal("-70.4000000"),
        departure_time=timezone.now() + timedelta(days=1),
        status="active",
    )


# ── EmergencyContact ─────────────────────────────────────────────


@pytest.mark.django_db
def test_emergency_contact_creation(user):
    ec = EmergencyContact.objects.create(
        user=user,
        contact_name="Mom",
        contact_phone="+56912345678",
        relationship="Mother",
    )
    assert ec.pk is not None
    assert ec.contact_name == "Mom"
    assert "Mom" in str(ec)
    assert "Mother" in str(ec)


@pytest.mark.django_db
def test_emergency_contact_str_includes_user(user):
    ec = EmergencyContact.objects.create(
        user=user,
        contact_name="Dad",
        contact_phone="+56987654321",
        relationship="Father",
    )
    assert str(user) in str(ec)


# ── EmergencyAlert ───────────────────────────────────────────────


@pytest.mark.django_db
def test_emergency_alert_creation(user, trip):
    alert = EmergencyAlert.objects.create(
        trip=trip,
        triggered_by=user,
        latitude=Decimal("-33.5000000"),
        longitude=Decimal("-70.5000000"),
        message="Help!",
    )
    assert alert.pk is not None
    assert alert.resolved is False
    assert alert.resolved_at is None


@pytest.mark.django_db
def test_emergency_alert_resolve(user, trip):
    alert = EmergencyAlert.objects.create(
        trip=trip,
        triggered_by=user,
        latitude=Decimal("-33.5000000"),
        longitude=Decimal("-70.5000000"),
    )
    alert.resolve()
    alert.refresh_from_db()
    assert alert.resolved is True
    assert alert.resolved_at is not None


@pytest.mark.django_db
def test_emergency_alert_str(user, trip):
    alert = EmergencyAlert.objects.create(
        trip=trip,
        triggered_by=user,
        latitude=Decimal("-33.5000000"),
        longitude=Decimal("-70.5000000"),
    )
    assert "Emergency" in str(alert)
