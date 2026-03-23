from datetime import timedelta
from decimal import Decimal

import pytest
from django.utils import timezone

from activities.models import Activity, Category
from payments.models import ConnectAccount, Payment, Subscription
from users.models import CustomUser


@pytest.fixture
def user(db):
    return CustomUser.objects.create_user(
        email="pay@example.com", password="pw", full_name="Payer"
    )


@pytest.fixture
def activity(db):
    cat = Category.objects.create(name="PayCat", slug="paycat")
    org = CustomUser.objects.create_user(
        email="payorg@example.com", password="pw", full_name="PayOrg"
    )
    return Activity.objects.create(
        title="Paid Activity",
        description="desc",
        category=cat,
        organizer=org,
        location_name="Place",
        latitude=Decimal("-33.4500000"),
        longitude=Decimal("-70.6500000"),
        start_datetime=timezone.now() + timedelta(days=1),
        end_datetime=timezone.now() + timedelta(days=1, hours=2),
        price=Decimal("5000.00"),
        is_free=False,
    )


# ── Payment ──────────────────────────────────────────────────────


@pytest.mark.django_db
def test_payment_creation(user, activity):
    payment = Payment.objects.create(
        user=user,
        activity=activity,
        amount=Decimal("5000.00"),
        currency="CLP",
        platform_fee=Decimal("500.00"),
        organizer_payout=Decimal("4500.00"),
        status="pending",
    )
    assert payment.pk is not None
    assert payment.amount == Decimal("5000.00")
    assert payment.status == "pending"


@pytest.mark.django_db
def test_payment_default_currency(user, activity):
    payment = Payment.objects.create(
        user=user, activity=activity, amount=Decimal("1000.00")
    )
    assert payment.currency == "CLP"


# ── Subscription get_or_create ───────────────────────────────────


@pytest.mark.django_db
def test_subscription_get_or_create_default_free(user):
    sub, created = Subscription.objects.get_or_create(
        user=user, defaults={"plan": "free"}
    )
    assert created is True
    assert sub.plan == "free"
    assert sub.user == user


@pytest.mark.django_db
def test_subscription_get_or_create_returns_existing(user):
    Subscription.objects.create(user=user, plan="organizer")
    sub, created = Subscription.objects.get_or_create(
        user=user, defaults={"plan": "free"}
    )
    assert created is False
    assert sub.plan == "organizer"


# ── ConnectAccount ───────────────────────────────────────────────


@pytest.mark.django_db
def test_connect_account_str(user):
    acct = ConnectAccount.objects.create(
        user=user, stripe_account_id="acct_123abc"
    )
    assert "pay@example.com" in str(acct)
    assert "acct_123abc" in str(acct)


@pytest.mark.django_db
def test_connect_account_defaults(user):
    acct = ConnectAccount.objects.create(
        user=user, stripe_account_id="acct_xyz"
    )
    assert acct.charges_enabled is False
    assert acct.payouts_enabled is False
    assert acct.onboarding_complete is False
