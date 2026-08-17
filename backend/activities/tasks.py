"""
Celery tasks for activities: feed scoring.
"""

import logging

from celery import shared_task
from django.utils import timezone

logger = logging.getLogger(__name__)


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
