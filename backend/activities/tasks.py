"""
Celery tasks for activities: story cleanup, feed scoring, squad notifications.
"""

import logging

from celery import shared_task
from django.utils import timezone

logger = logging.getLogger(__name__)


@shared_task
def cleanup_expired_stories():
    """Delete expired stories (48h TTL). Run via Celery Beat every hour."""
    from .models import ActivityStory

    count, _ = ActivityStory.objects.filter(expires_at__lt=timezone.now()).delete()
    if count:
        logger.info('Cleaned up %d expired stories', count)
    return count


@shared_task
def cleanup_expired_availability():
    """Delete expired availability statuses (24h TTL). Run via Celery Beat every hour."""
    from .models import AvailabilityStatus

    count, _ = AvailabilityStatus.objects.filter(expires_at__lt=timezone.now()).delete()
    if count:
        logger.info('Cleaned up %d expired availability statuses', count)
    return count


@shared_task
def notify_squad_activity_joined(user_id, activity_id):
    """When a squad member joins an activity, notify the rest of the squad."""
    from .models import Activity
    from users.models import CustomUser

    try:
        user = CustomUser.objects.get(id=user_id)
        activity = Activity.objects.get(id=activity_id)
    except (CustomUser.DoesNotExist, Activity.DoesNotExist):
        return

    # Find all squads the user belongs to
    squad_ids = user.squads.values_list('id', flat=True)
    if not squad_ids:
        return

    from .models import SquadMember
    squad_member_ids = (
        SquadMember.objects.filter(
            squad_id__in=squad_ids, is_active=True
        )
        .exclude(user_id=user_id)
        .values_list('user_id', flat=True)
        .distinct()
    )

    from notifications.tasks import send_notification
    for member_id in squad_member_ids:
        send_notification.delay(
            member_id,
            'activity_joined',
            f'{user.display_name} se unio a una actividad',
            f'Tu amigo {user.display_name} se unio a "{activity.title}". Unite!',
            {'activity_id': activity_id, 'user_id': user_id},
        )

    logger.info(
        'Squad notification sent for user=%d activity=%d to %d members',
        user_id, activity_id, len(squad_member_ids),
    )


@shared_task
def compute_feed_scores():
    """
    Simple collaborative filtering: score activities based on user affinity.
    Run periodically to update a Redis-backed feed cache.
    """
    from django.core.cache import cache

    from .models import Activity, ActivityParticipant

    # Get all published activities
    activities = Activity.objects.filter(
        status='published',
        start_datetime__gt=timezone.now(),
    ).values_list('id', 'category_id', 'latitude', 'longitude')

    # Build category popularity scores
    category_scores = {}
    participations = (
        ActivityParticipant.objects.filter(status='confirmed')
        .values_list('user_id', 'activity__category_id')
    )

    user_categories = {}
    for user_id, cat_id in participations:
        user_categories.setdefault(user_id, {})
        user_categories[user_id][cat_id] = user_categories[user_id].get(cat_id, 0) + 1
        category_scores[cat_id] = category_scores.get(cat_id, 0) + 1

    # Store per-user feed scores in Redis
    for user_id, cats in user_categories.items():
        scored_activities = []
        for act_id, cat_id, lat, lng in activities:
            score = cats.get(cat_id, 0) * 10  # Category affinity weight
            score += category_scores.get(cat_id, 0)  # Global popularity
            scored_activities.append((act_id, score))

        scored_activities.sort(key=lambda x: x[1], reverse=True)
        feed_ids = [aid for aid, _ in scored_activities[:50]]
        cache.set(f'feed:user:{user_id}', feed_ids, timeout=3600)

    logger.info('Feed scores computed for %d users', len(user_categories))
    return len(user_categories)
