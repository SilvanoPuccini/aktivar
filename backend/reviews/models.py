import logging

from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from django.db.models import Avg
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver

logger = logging.getLogger(__name__)


class Review(models.Model):
    reviewer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='reviews_given',
    )
    reviewee = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='reviews_received',
    )
    activity = models.ForeignKey(
        'activities.Activity', on_delete=models.CASCADE, related_name='reviews'
    )
    rating = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    comment = models.TextField(max_length=1000, blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['reviewer', 'reviewee', 'activity']
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.reviewer} -> {self.reviewee}: {self.rating} stars"


class Report(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('reviewed', 'Reviewed'),
        ('resolved', 'Resolved'),
        ('dismissed', 'Dismissed'),
    ]
    REASON_CHOICES = [
        ('spam', 'Spam'),
        ('harassment', 'Harassment'),
        ('inappropriate', 'Inappropriate Content'),
        ('safety', 'Safety Concern'),
        ('other', 'Other'),
    ]

    reporter = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='reports_filed',
    )
    reported_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='reports_received',
        null=True,
        blank=True,
    )
    activity = models.ForeignKey(
        'activities.Activity',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='reports',
    )
    reason = models.CharField(max_length=50, choices=REASON_CHOICES)
    description = models.TextField(max_length=1000)
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default='pending'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    resolved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']


# ── Signal: Update avg_rating on UserProfile after review save/delete ──

def _update_reviewee_rating(reviewee_id):
    """Recalculate avg_rating and total_reviews for a user."""
    from users.models import UserProfile

    agg = Review.objects.filter(reviewee_id=reviewee_id).aggregate(
        avg=Avg('rating'),
        count=models.Count('id'),
    )
    try:
        profile = UserProfile.objects.get(user_id=reviewee_id)
        profile.avg_rating = round(agg['avg'] or 0, 2)
        profile.total_reviews = agg['count'] or 0
        profile.save(update_fields=['avg_rating', 'total_reviews'])
    except UserProfile.DoesNotExist:
        logger.warning('UserProfile not found for user %d', reviewee_id)


@receiver(post_save, sender=Review)
def update_rating_on_review_save(sender, instance, **kwargs):
    _update_reviewee_rating(instance.reviewee_id)


@receiver(post_delete, sender=Review)
def update_rating_on_review_delete(sender, instance, **kwargs):
    _update_reviewee_rating(instance.reviewee_id)
