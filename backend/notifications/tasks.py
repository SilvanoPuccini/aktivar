import logging

from celery import shared_task

logger = logging.getLogger(__name__)


@shared_task
def send_notification(user_id, notification_type, title, body, data=None):
    """
    Create an in-app notification and trigger email/push delivery.
    """
    from .models import Notification

    notification = Notification.objects.create(
        user_id=user_id,
        notification_type=notification_type,
        title=title,
        body=body,
        data=data or {},
    )
    logger.info(
        'Notification created: id=%d type=%s user=%d',
        notification.id,
        notification_type,
        user_id,
    )

    # Trigger push and email in parallel
    send_push_notification.delay(notification.id)
    send_email_notification.delay(notification.id)

    return notification.id


@shared_task
def send_email_notification(notification_id):
    """
    Send an email notification. Mock implementation that logs the action.
    """
    from .models import Notification

    try:
        notification = Notification.objects.select_related('user').get(id=notification_id)
        logger.info(
            'Email notification sent: id=%d to=%s subject=%s',
            notification.id,
            notification.user.email,
            notification.title,
        )
    except Notification.DoesNotExist:
        logger.warning('Notification %d not found for email delivery', notification_id)


@shared_task
def send_push_notification(notification_id):
    """
    Send a push notification. Mock implementation that logs the action.
    """
    from .models import Notification, PushSubscription

    try:
        notification = Notification.objects.select_related('user').get(id=notification_id)
        subscriptions = PushSubscription.objects.filter(
            user=notification.user, is_active=True
        )
        for sub in subscriptions:
            logger.info(
                'Push notification sent: id=%d endpoint=%s',
                notification.id,
                sub.endpoint[:80],
            )
        if not subscriptions.exists():
            logger.info(
                'No active push subscriptions for user %d', notification.user_id
            )
    except Notification.DoesNotExist:
        logger.warning('Notification %d not found for push delivery', notification_id)
