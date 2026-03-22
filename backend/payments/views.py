import logging

from django.conf import settings
from rest_framework import mixins, permissions, status, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Payment, Subscription
from .serializers import PaymentSerializer, SubscriptionSerializer
from .webhooks import handle_stripe_webhook

logger = logging.getLogger(__name__)


class PaymentViewSet(
    mixins.ListModelMixin, mixins.CreateModelMixin, viewsets.GenericViewSet
):
    """Create a payment intent and list user payments."""

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

        # Create Stripe PaymentIntent
        try:
            import stripe

            stripe.api_key = getattr(settings, 'STRIPE_SECRET_KEY', '')
            intent = stripe.PaymentIntent.create(
                amount=int(amount * 100),  # Convert to smallest currency unit
                currency=currency.lower(),
                metadata={
                    'user_id': request.user.id,
                    'activity_id': activity.id if activity else '',
                },
            )
            payment = serializer.save(
                user=request.user,
                stripe_payment_intent_id=intent['id'],
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
