from django.conf import settings
from django.db import models


class Notification(models.Model):
    TYPES = [
        ('activity_joined', 'Activity Joined'),
        ('activity_reminder', 'Activity Reminder'),
        ('spot_freed', 'Spot Freed'),
        ('new_message', 'New Message'),
        ('review_request', 'Review Request'),
        ('payment', 'Payment'),
        ('system', 'System'),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notifications'
    )
    notification_type = models.CharField(max_length=30, choices=TYPES)
    title = models.CharField(max_length=200)
    body = models.TextField()
    data = models.JSONField(default=dict, blank=True)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [models.Index(fields=['user', 'is_read'])]

    def __str__(self):
        return f"{self.user}: {self.title}"


class PushSubscription(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='push_subscriptions'
    )
    endpoint = models.URLField(max_length=500)
    keys = models.JSONField(default=dict)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['user', 'endpoint']

    def __str__(self):
        return f"Push sub for {self.user} ({self.endpoint[:50]})"
