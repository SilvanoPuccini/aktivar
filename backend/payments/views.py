import logging
from decimal import Decimal

from django.conf import settings
from rest_framework import mixins, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import ConnectAccount, Payment, Subscription
from .serializers import PaymentSerializer, SubscriptionSerializer
from .webhooks import handle_stripe_webhook

logger = logging.getLogger(__name__)

PLATFORM_FEE_PERCENT = Decimal('0.10')  # 10% platform fee


class PaymentViewSet(
    mixins.ListModelMixin, mixins.CreateModelMixin, viewsets.GenericViewSet
):
    """Create a payment intent (with Connect split) and list user payments."""

    serializer_class = PaymentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Payment.objects.filter(user=self.request.user)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        activity = serializer.validated_data.get('activity')
        amount = serializer.validated_data['amount']
        currency = serializer.validated_data.get('currency', 'CLP')

        try:
            import stripe

            stripe.api_key = getattr(settings, 'STRIPE_SECRET_KEY', '')
            amount_cents = int(amount * 100)

            # Stripe Connect: route payment to organizer if they have a Connect account
            create_kwargs = {
                'amount': amount_cents,
                'currency': currency.lower(),
                'metadata': {
                    'user_id': request.user.id,
                    'activity_id': activity.id if activity else '',
                },
            }

            platform_fee = Decimal('0')
            organizer_payout = Decimal('0')

            if activity:
                try:
                    connect_account = ConnectAccount.objects.get(
                        user=activity.organizer,
                        charges_enabled=True,
                    )
                    # Use Connect with application_fee_amount (10%)
                    fee_cents = int(amount_cents * float(PLATFORM_FEE_PERCENT))
                    create_kwargs['application_fee_amount'] = fee_cents
                    create_kwargs['transfer_data'] = {
                        'destination': connect_account.stripe_account_id,
                    }
                    platform_fee = amount * PLATFORM_FEE_PERCENT
                    organizer_payout = amount - platform_fee
                except ConnectAccount.DoesNotExist:
                    pass  # Direct payment without Connect split

            intent = stripe.PaymentIntent.create(**create_kwargs)
            payment = serializer.save(
                user=request.user,
                stripe_payment_intent_id=intent['id'],
                platform_fee=platform_fee,
                organizer_payout=organizer_payout,
                status='pending',
            )
            return Response(
                {
                    'payment': PaymentSerializer(payment).data,
                    'client_secret': intent['client_secret'],
                },
                status=status.HTTP_201_CREATED,
            )
        except Exception as e:
            logger.error('Failed to create payment intent: %s', str(e))
            return Response(
                {'detail': 'Failed to create payment. Please try again.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


# ── Stripe Connect Onboarding ─────────────────────────────────────

class ConnectOnboardingView(APIView):
    """Create a Stripe Connect Express account and return onboarding URL."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        if user.role not in ('organizer', 'driver'):
            return Response(
                {'detail': 'Only organizers can create Connect accounts.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            connect = ConnectAccount.objects.get(user=user)
            if connect.onboarding_complete:
                return Response({'detail': 'Connect account already set up.'})
        except ConnectAccount.DoesNotExist:
            connect = None

        try:
            import stripe
            stripe.api_key = getattr(settings, 'STRIPE_SECRET_KEY', '')

            if not connect:
                account = stripe.Account.create(
                    type='express',
                    country='CL',
                    email=user.email,
                    capabilities={
                        'card_payments': {'requested': True},
                        'transfers': {'requested': True},
                    },
                    metadata={'user_id': user.id},
                )
                connect = ConnectAccount.objects.create(
                    user=user,
                    stripe_account_id=account['id'],
                )

            # Create account link for onboarding
            frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')
            account_link = stripe.AccountLink.create(
                account=connect.stripe_account_id,
                refresh_url=f'{frontend_url}/profile?connect=refresh',
                return_url=f'{frontend_url}/profile?connect=success',
                type='account_onboarding',
            )

            return Response({
                'onboarding_url': account_link['url'],
                'stripe_account_id': connect.stripe_account_id,
            })
        except Exception as e:
            logger.error('Connect onboarding error: %s', str(e))
            return Response(
                {'detail': 'Failed to create Connect account.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class ConnectDashboardView(APIView):
    """Return a Stripe Express dashboard login link for the organizer."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        try:
            connect = ConnectAccount.objects.get(user=request.user)
        except ConnectAccount.DoesNotExist:
            return Response(
                {'detail': 'No Connect account found.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        try:
            import stripe
            stripe.api_key = getattr(settings, 'STRIPE_SECRET_KEY', '')
            login_link = stripe.Account.create_login_link(
                connect.stripe_account_id,
            )
            return Response({'dashboard_url': login_link['url']})
        except Exception as e:
            logger.error('Connect dashboard link error: %s', str(e))
            return Response(
                {'detail': 'Failed to generate dashboard link.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


# ── Subscriptions with Billing Portal ─────────────────────────────

class SubscriptionViewSet(
    mixins.RetrieveModelMixin, mixins.UpdateModelMixin, viewsets.GenericViewSet
):
    """View and update user subscription."""

    serializer_class = SubscriptionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Subscription.objects.filter(user=self.request.user)

    def get_object(self):
        sub, _created = Subscription.objects.get_or_create(
            user=self.request.user, defaults={'plan': 'free'}
        )
        return sub

    @action(detail=False, methods=['post'], url_path='create-checkout')
    def create_checkout(self, request):
        """Create a Stripe Checkout Session for subscription upgrade."""
        plan = request.data.get('plan', 'explorer')

        # Map plan names to Stripe price IDs (configured in env)
        price_map = {
            'organizer': getattr(settings, 'STRIPE_PRICE_ORGANIZER', ''),
            'explorer': getattr(settings, 'STRIPE_PRICE_EXPLORER', ''),
        }
        price_id = price_map.get(plan)
        if not price_id:
            return Response(
                {'detail': f'Invalid plan: {plan}'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            import stripe
            stripe.api_key = getattr(settings, 'STRIPE_SECRET_KEY', '')

            # Get or create Stripe customer
            sub = self.get_object()
            if not sub.stripe_customer_id:
                customer = stripe.Customer.create(
                    email=request.user.email,
                    metadata={'user_id': request.user.id},
                )
                sub.stripe_customer_id = customer['id']
                sub.save(update_fields=['stripe_customer_id'])

            frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')
            session = stripe.checkout.Session.create(
                customer=sub.stripe_customer_id,
                mode='subscription',
                line_items=[{'price': price_id, 'quantity': 1}],
                success_url=f'{frontend_url}/profile?subscription=success',
                cancel_url=f'{frontend_url}/profile?subscription=cancelled',
                metadata={'user_id': request.user.id, 'plan': plan},
            )

            return Response({'checkout_url': session['url']})
        except Exception as e:
            logger.error('Subscription checkout error: %s', str(e))
            return Response(
                {'detail': 'Failed to create checkout session.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    @action(detail=False, methods=['post'], url_path='billing-portal')
    def billing_portal(self, request):
        """Create a Stripe Billing Portal session for managing subscriptions."""
        sub = self.get_object()
        if not sub.stripe_customer_id:
            return Response(
                {'detail': 'No active subscription to manage.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            import stripe
            stripe.api_key = getattr(settings, 'STRIPE_SECRET_KEY', '')
            frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')

            portal = stripe.billing_portal.Session.create(
                customer=sub.stripe_customer_id,
                return_url=f'{frontend_url}/profile',
            )
            return Response({'portal_url': portal['url']})
        except Exception as e:
            logger.error('Billing portal error: %s', str(e))
            return Response(
                {'detail': 'Failed to create billing portal session.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


# ── Stripe Webhook ─────────────────────────────────────────────────

class StripeWebhookView(APIView):
    """Handle incoming Stripe webhook events."""

    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request, *args, **kwargs):
        payload = request.body
        sig_header = request.META.get('HTTP_STRIPE_SIGNATURE', '')

        try:
            result = handle_stripe_webhook(payload, sig_header)
            return Response(result, status=status.HTTP_200_OK)
        except ValueError:
            return Response(
                {'detail': 'Invalid payload'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except Exception:
            return Response(
                {'detail': 'Webhook signature verification failed'},
                status=status.HTTP_400_BAD_REQUEST,
            )
