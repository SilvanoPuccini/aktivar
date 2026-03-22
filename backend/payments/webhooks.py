import logging

from django.conf import settings
from django.utils import timezone

from .models import Payment, StripeEvent, Subscription

logger = logging.getLogger(__name__)


def handle_stripe_webhook(payload, sig_header):
    """
    Process a Stripe webhook event.

    Verifies the webhook signature, checks for idempotency, and dispatches
    the event to the appropriate handler.
    """
    import stripe

    endpoint_secret = getattr(settings, 'STRIPE_WEBHOOK_SECRET', '')

    try:
        event = stripe.Webhook.construct_event(payload, sig_header, endpoint_secret)
    except ValueError:
        logger.error('Invalid Stripe webhook payload')
        raise
    except stripe.error.SignatureVerificationError:
        logger.error('Invalid Stripe webhook signature')
        raise

    # Idempotency check
    if StripeEvent.objects.filter(stripe_event_id=event['id']).exists():
        logger.info('Duplicate Stripe event %s, skipping', event['id'])
        return {'status': 'duplicate'}

    # Store the event
    stripe_event = StripeEvent.objects.create(
        stripe_event_id=event['id'],
        event_type=event['type'],
        data=event['data'],
    )

    # Dispatch to handlers
    event_type = event['type']
    try:
        if event_type == 'payment_intent.succeeded':
            _handle_payment_succeeded(event['data']['object'])
        elif event_type == 'payment_intent.payment_failed':
            _handle_payment_failed(event['data']['object'])
        elif event_type == 'customer.subscription.updated':
            _handle_subscription_updated(event['data']['object'])
        elif event_type == 'customer.subscription.deleted':
            _handle_subscription_deleted(event['data']['object'])
        else:
            logger.info('Unhandled Stripe event type: %s', event_type)

        stripe_event.processed = True
        stripe_event.processed_at = timezone.now()
        stripe_event.save()
    except Exception:
        logger.exception('Error processing Stripe event %s', event['id'])
        raise

    return {'status': 'processed'}


def _handle_payment_succeeded(payment_intent):
    payment_intent_id = payment_intent['id']
    Payment.objects.filter(stripe_payment_intent_id=payment_intent_id).update(
        status='succeeded'
    )
    logger.info('Payment succeeded: %s', payment_intent_id)


def _handle_payment_failed(payment_intent):
    payment_intent_id = payment_intent['id']
    Payment.objects.filter(stripe_payment_intent_id=payment_intent_id).update(
        status='failed'
    )
    logger.info('Payment failed: %s', payment_intent_id)


def _handle_subscription_updated(subscription_data):
    stripe_sub_id = subscription_data['id']
    try:
        sub = Subscription.objects.get(stripe_subscription_id=stripe_sub_id)
        sub.status = subscription_data.get('status', sub.status)
        sub.save()
        logger.info('Subscription updated: %s', stripe_sub_id)
    except Subscription.DoesNotExist:
        logger.warning('Subscription not found for Stripe ID: %s', stripe_sub_id)


def _handle_subscription_deleted(subscription_data):
    stripe_sub_id = subscription_data['id']
    try:
        sub = Subscription.objects.get(stripe_subscription_id=stripe_sub_id)
        sub.status = 'canceled'
        sub.save()
        logger.info('Subscription canceled: %s', stripe_sub_id)
    except Subscription.DoesNotExist:
        logger.warning('Subscription not found for Stripe ID: %s', stripe_sub_id)
