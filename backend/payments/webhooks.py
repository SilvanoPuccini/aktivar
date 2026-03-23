import logging

from django.conf import settings
from django.utils import timezone

from .models import ConnectAccount, Payment, StripeEvent, Subscription

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
    handlers = {
        'payment_intent.succeeded': _handle_payment_succeeded,
        'payment_intent.payment_failed': _handle_payment_failed,
        'customer.subscription.created': _handle_subscription_created,
        'customer.subscription.updated': _handle_subscription_updated,
        'customer.subscription.deleted': _handle_subscription_deleted,
        'checkout.session.completed': _handle_checkout_completed,
        'account.updated': _handle_connect_account_updated,
    }

    handler = handlers.get(event_type)
    try:
        if handler:
            handler(event['data']['object'])
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


def _handle_checkout_completed(session):
    """Handle Checkout Session completion for subscriptions."""
    if session.get('mode') != 'subscription':
        return

    customer_id = session.get('customer')
    subscription_id = session.get('subscription')
    plan = session.get('metadata', {}).get('plan', 'explorer')

    try:
        sub = Subscription.objects.get(stripe_customer_id=customer_id)
        sub.stripe_subscription_id = subscription_id
        sub.plan = plan
        sub.status = 'active'
        sub.save(update_fields=['stripe_subscription_id', 'plan', 'status'])
        logger.info('Subscription activated via checkout: %s', subscription_id)
    except Subscription.DoesNotExist:
        logger.warning('Subscription not found for customer: %s', customer_id)


def _handle_subscription_created(subscription_data):
    """Sync newly created subscription."""
    _sync_subscription(subscription_data)


def _handle_subscription_updated(subscription_data):
    """Sync updated subscription status and period."""
    _sync_subscription(subscription_data)


def _handle_subscription_deleted(subscription_data):
    """Handle subscription cancellation — graceful downgrade to free."""
    stripe_sub_id = subscription_data['id']
    try:
        sub = Subscription.objects.get(stripe_subscription_id=stripe_sub_id)
        sub.status = 'canceled'
        sub.plan = 'free'  # Graceful downgrade
        sub.save(update_fields=['status', 'plan'])
        logger.info('Subscription canceled, downgraded to free: %s', stripe_sub_id)
    except Subscription.DoesNotExist:
        logger.warning('Subscription not found for Stripe ID: %s', stripe_sub_id)


def _sync_subscription(subscription_data):
    """Common sync logic for subscription create/update."""
    stripe_sub_id = subscription_data['id']
    customer_id = subscription_data.get('customer')
    sub_status = subscription_data.get('status', 'active')

    # Parse current_period_end
    period_end = subscription_data.get('current_period_end')
    period_end_dt = None
    if period_end:
        from datetime import datetime
        period_end_dt = datetime.fromtimestamp(period_end, tz=timezone.utc)

    try:
        sub = Subscription.objects.get(stripe_customer_id=customer_id)
        sub.stripe_subscription_id = stripe_sub_id
        sub.status = sub_status
        if period_end_dt:
            sub.current_period_end = period_end_dt
        sub.save(update_fields=['stripe_subscription_id', 'status', 'current_period_end'])
        logger.info('Subscription synced: %s status=%s', stripe_sub_id, sub_status)
    except Subscription.DoesNotExist:
        logger.warning('Subscription not found for customer: %s', customer_id)


def _handle_connect_account_updated(account_data):
    """Sync Connect account status when Stripe notifies us."""
    account_id = account_data['id']
    try:
        connect = ConnectAccount.objects.get(stripe_account_id=account_id)
        connect.charges_enabled = account_data.get('charges_enabled', False)
        connect.payouts_enabled = account_data.get('payouts_enabled', False)
        connect.onboarding_complete = (
            connect.charges_enabled and connect.payouts_enabled
        )
        connect.save(update_fields=[
            'charges_enabled', 'payouts_enabled', 'onboarding_complete',
        ])
        logger.info(
            'Connect account updated: %s charges=%s payouts=%s',
            account_id, connect.charges_enabled, connect.payouts_enabled,
        )
    except ConnectAccount.DoesNotExist:
        logger.warning('Connect account not found: %s', account_id)
