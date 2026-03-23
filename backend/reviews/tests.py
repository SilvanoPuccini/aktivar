from datetime import timedelta
from decimal import Decimal

import pytest
from django.db import IntegrityError
from django.utils import timezone

from activities.models import Activity, Category
from reviews.models import Review
from users.models import CustomUser, UserProfile


@pytest.fixture
def reviewer(db):
    return CustomUser.objects.create_user(
        email="reviewer@example.com", password="pw", full_name="Reviewer"
    )


@pytest.fixture
def reviewee(db):
    return CustomUser.objects.create_user(
        email="reviewee@example.com", password="pw", full_name="Reviewee"
    )


@pytest.fixture
def activity(db):
    cat = Category.objects.create(name="Test", slug="test")
    organizer = CustomUser.objects.create_user(
        email="org@example.com", password="pw", full_name="Org"
    )
    return Activity.objects.create(
        title="Test Activity",
        description="desc",
        category=cat,
        organizer=organizer,
        location_name="Place",
        latitude=Decimal("-33.4500000"),
        longitude=Decimal("-70.6500000"),
        start_datetime=timezone.now() + timedelta(days=1),
        end_datetime=timezone.now() + timedelta(days=1, hours=2),
    )


# ── Review creation ──────────────────────────────────────────────


@pytest.mark.django_db
def test_review_creation(reviewer, reviewee, activity):
    review = Review.objects.create(
        reviewer=reviewer, reviewee=reviewee, activity=activity, rating=4, comment="Good"
    )
    assert review.pk is not None
    assert review.rating == 4
    assert "4 stars" in str(review)


@pytest.mark.django_db
def test_review_unique_together(reviewer, reviewee, activity):
    Review.objects.create(
        reviewer=reviewer, reviewee=reviewee, activity=activity, rating=5
    )
    with pytest.raises(IntegrityError):
        Review.objects.create(
            reviewer=reviewer, reviewee=reviewee, activity=activity, rating=3
        )


# ── Signal: _update_reviewee_rating ──────────────────────────────


@pytest.mark.django_db
def test_signal_updates_avg_rating_on_save(reviewer, reviewee, activity):
    Review.objects.create(
        reviewer=reviewer, reviewee=reviewee, activity=activity, rating=4
    )
    profile = UserProfile.objects.get(user=reviewee)
    assert float(profile.avg_rating) == 4.0
    assert profile.total_reviews == 1


@pytest.mark.django_db
def test_signal_updates_avg_rating_multiple_reviews(reviewee, activity):
    r1 = CustomUser.objects.create_user(
        email="r1@example.com", password="pw", full_name="R1"
    )
    r2 = CustomUser.objects.create_user(
        email="r2@example.com", password="pw", full_name="R2"
    )
    Review.objects.create(
        reviewer=r1, reviewee=reviewee, activity=activity, rating=4
    )
    cat2 = Category.objects.create(name="Cat2", slug="cat2")
    org = CustomUser.objects.create_user(
        email="org2@example.com", password="pw", full_name="Org2"
    )
    act2 = Activity.objects.create(
        title="Act2",
        description="desc",
        category=cat2,
        organizer=org,
        location_name="P",
        latitude=Decimal("-33.4500000"),
        longitude=Decimal("-70.6500000"),
        start_datetime=timezone.now() + timedelta(days=2),
        end_datetime=timezone.now() + timedelta(days=2, hours=2),
    )
    Review.objects.create(
        reviewer=r2, reviewee=reviewee, activity=act2, rating=2
    )
    profile = UserProfile.objects.get(user=reviewee)
    assert float(profile.avg_rating) == 3.0
    assert profile.total_reviews == 2


@pytest.mark.django_db
def test_signal_updates_avg_rating_on_delete(reviewer, reviewee, activity):
    review = Review.objects.create(
        reviewer=reviewer, reviewee=reviewee, activity=activity, rating=5
    )
    review.delete()
    profile = UserProfile.objects.get(user=reviewee)
    assert float(profile.avg_rating) == 0
    assert profile.total_reviews == 0
